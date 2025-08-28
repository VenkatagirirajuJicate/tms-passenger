import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

export interface ParentAppUser {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: string;
  institution_id?: string;
  is_super_admin?: boolean;
  permissions: Record<string, boolean>;
  profile_completed?: boolean;
  avatar_url?: string;
  last_login?: string;
  // Enhanced student-related fields (added during authentication)
  studentId?: string;
  rollNumber?: string;
  isNewStudent?: boolean;
  departmentId?: string;
  programId?: string;
  profileCompletionPercentage?: number;
}

export interface AuthSession {
  id: string;
  expires_at: string;
  created_at: string;
  last_used_at?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: ParentAppUser;
}

export interface ValidationResponse {
  valid: boolean;
  user?: ParentAppUser;
  session?: AuthSession;
  error?: string;
}

class ParentAuthService {
  private api: AxiosInstance;
  private refreshPromise: Promise<boolean> | null = null;
  private networkErrorCount: number = 0;
  private maxNetworkErrors: number = 3;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_PARENT_APP_URL || 'https://my.jkkn.ac.in',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '' // Changed to lowercase
      }
    });

    // Migrate old session data to new format if needed
    this.migrateOldSessionData();

    // Add request interceptor to include auth header
    this.api.interceptors.request.use((config) => {
      const token = this.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true;

          const refreshed = await this.refreshToken();
          if (refreshed) {
            const token = this.getAccessToken();
            error.config.headers.Authorization = `Bearer ${token}`;
            return this.api.request(error.config);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Initiate OAuth login flow
   */
  login(redirectUrl?: string): void {
    console.log('🔗 [PARENT AUTH] Step 4: Starting OAuth URL generation');
    
    const state = this.generateState();
    sessionStorage.setItem('oauth_state', state);
    console.log('🔗 [PARENT AUTH] Step 5: OAuth state generated and stored:', state.substring(0, 10) + '...');

    if (redirectUrl) {
      sessionStorage.setItem('post_login_redirect', redirectUrl);
      console.log('🔗 [PARENT AUTH] Step 6: Post-login redirect URL stored:', redirectUrl);
    }

    // Use the child app authorization endpoint
    const authUrl = new URL(
      '/api/auth/child-app/authorize',
      process.env.NEXT_PUBLIC_PARENT_APP_URL || 'https://my.jkkn.ac.in'
    );
    
    console.log('🔗 [PARENT AUTH] Step 7: Building OAuth URL with parameters');
    
    // Enhanced parameter configuration for better compatibility
    const appId = process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674';
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'app_e20655605d48ebce_cfa1ffe34268949a';
    
    // Get OAuth role to determine user type
    const oauthRole = typeof window !== 'undefined' ? sessionStorage.getItem('tms_oauth_role') : null;
    const userType = oauthRole || 'passenger';
    
    // Use unified callback URL for both passenger and driver
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3003/auth/callback';
    
    console.log('🔗 [PARENT AUTH] Unified callback URL configuration:', {
      userType,
      oauthRole,
      redirectUri,
      isDriverOAuth: userType === 'driver'
    });
    
    // Add parameters in specific order (some OAuth servers are sensitive to parameter order)
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', appId); // Try both client_id and app_id
    authUrl.searchParams.append('app_id', appId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', 'read write profile');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('user_type', userType); // Add user type parameter
    authUrl.searchParams.append('oauth_role', userType); // Alternative parameter name
    authUrl.searchParams.append('api_key', apiKey); // Move api_key to end

    console.log('🔗 [PARENT AUTH] Step 8: OAuth URL generated successfully');
    console.log('🔗 [PARENT AUTH] Full OAuth URL:', authUrl.toString());
    console.log('🔗 [PARENT AUTH] OAuth Parameters:', {
      response_type: 'code',
      app_id: process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674',
      api_key: (process.env.NEXT_PUBLIC_API_KEY || 'app_e20655605d48ebce_cfa1ffe34268949a').substring(0, 15) + '...',
      redirect_uri: redirectUri,
      scope: 'read write profile',
      user_type: userType,
      oauth_role: userType,
      state: state.substring(0, 10) + '...'
    });
    
    console.log('🔗 [PARENT AUTH] Environment Variables Check:', {
      PARENT_APP_URL: process.env.NEXT_PUBLIC_PARENT_APP_URL || 'https://my.jkkn.ac.in',
      APP_ID: process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674',
      REDIRECT_URI: redirectUri,
      API_KEY_SET: !!(process.env.NEXT_PUBLIC_API_KEY)
    });

    console.log('🔗 [PARENT AUTH] Step 9: Redirecting to parent app OAuth...');
    console.log('🔗 [PARENT AUTH] Target URL:', authUrl.toString().substring(0, 100) + '...');
    
    window.location.href = authUrl.toString();
  }

  async handleCallback(
    token: string,
    refreshToken?: string
  ): Promise<ParentAppUser | null> {
    try {
      console.log('HandleCallback called with:', {
        hasToken: !!token,
        tokenStart: token ? token.substring(0, 20) + '...' : 'none',
        hasRefreshToken: !!refreshToken
      });

      if (refreshToken) {
        this.setRefreshToken(refreshToken);
      }

      // Validate the token with parent app
      const validation = await this.validateToken(token);
      console.log('Validation result:', validation);

      console.log('Validation details:', {
        isValid: validation.valid,
        hasUser: !!validation.user,
        hasSession: !!validation.session,
        userId: validation.user?.id,
        userEmail: validation.user?.email
      });

      if (validation.valid && validation.user) {
        console.log('Setting auth data...');
        this.setAccessToken(token);
        this.setUser(validation.user);

        if (validation.session) {
          this.setSession(validation.session);
        }

        // Clear OAuth state
        sessionStorage.removeItem('oauth_state');

        console.log(
          'Auth callback successful, returning user:',
          validation.user.email
        );
        return validation.user;
      }

      throw new Error(validation.error || 'Token validation failed');
    } catch (error) {
      console.error('Auth callback error:', error);
      this.clearSession();
      throw error;
    }
  }

  /**
   * Validate access token
   */
  async validateToken(token: string): Promise<ValidationResponse> {
    try {
      // Use our local validation endpoint which handles both parent app and local validation
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token validation failed:', errorText);
        return {
          valid: false,
          error: `Validation failed: ${errorText}`
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Token validation error:', error);
      return {
        valid: false,
        error: 'Token validation failed'
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Skip refresh if we've had too many consecutive network errors
    if (this.networkErrorCount >= this.maxNetworkErrors) {
      console.warn(`🌐 Skipping token refresh due to ${this.networkErrorCount} consecutive network errors`);
      return false;
    }

    this.refreshPromise = this._doRefreshToken();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    return result;
  }

  private async _doRefreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        console.warn('🔄 No refresh token available, cannot refresh session');
        return false;
      }

      console.log('🔄 Attempting token refresh...');

      const response = await this.api.post('/api/auth/child-app/token', {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        app_id: process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674'
        // API key is sent in header, not body
      });

      const data: TokenResponse = response.data;

      this.setAccessToken(data.access_token);
      this.setUser(data.user);

      // Update refresh token if provided
      if (data.refresh_token) {
        this.setRefreshToken(data.refresh_token);
      }

      console.log('✅ Token refresh successful');
      // Reset network error count on success
      this.networkErrorCount = 0;
      return true;
    } catch (error: any) {
      console.error('❌ Token refresh failed:', {
        error: error.message,
        code: error.code,
        status: error.response?.status,
        isNetworkError: error.code === 'NETWORK_ERROR' || error.message === 'Network Error'
      });

      // Handle different types of errors
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        this.networkErrorCount++;
        console.warn(`🌐 Network error during token refresh (${this.networkErrorCount}/${this.maxNetworkErrors}) - parent app may be unavailable`);
        
        if (this.networkErrorCount >= this.maxNetworkErrors) {
          console.warn('🚫 Maximum network errors reached - disabling auto-refresh temporarily');
        }
        
        // Don't clear session immediately for network errors - allow retry
        return false;
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('🔒 Authentication error during token refresh - clearing session');
        // Reset network error count for auth errors
        this.networkErrorCount = 0;
        this.clearSession();
        return false;
      } else {
        console.warn('⚠️ Unknown error during token refresh - keeping session for now');
        // For other errors, don't clear session immediately
        return false;
      }
    }
  }

  /**
   * Reset network error count (call when connectivity is restored)
   */
  resetNetworkErrorCount(): void {
    if (this.networkErrorCount > 0) {
      console.log(`🔄 Resetting network error count (was ${this.networkErrorCount})`);
      this.networkErrorCount = 0;
    }
  }

  /**
   * Migrate old session data to new format (client-side only)
   */
  private migrateOldSessionData(): void {
    // Only run on client side to avoid SSR issues
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Check if we have old cookie-based tokens that need to be backed up to localStorage
      const cookieAccessToken = Cookies.get('access_token');
      const cookieRefreshToken = Cookies.get('refresh_token');
      
      if (cookieAccessToken && !localStorage.getItem('tms_access_token')) {
        localStorage.setItem('tms_access_token', cookieAccessToken);
        localStorage.setItem('tms_token_expires', (Date.now() + (24 * 60 * 60 * 1000)).toString());
        console.log('🔄 Migrated access token to localStorage');
      }
      
      if (cookieRefreshToken && !localStorage.getItem('tms_refresh_token')) {
        localStorage.setItem('tms_refresh_token', cookieRefreshToken);
        localStorage.setItem('tms_refresh_expires', (Date.now() + (30 * 24 * 60 * 60 * 1000)).toString());
        console.log('🔄 Migrated refresh token to localStorage');
      }

      // Migrate user data to new key format
      const oldUserData = localStorage.getItem('user_data');
      if (oldUserData && !localStorage.getItem('tms_user')) {
        localStorage.setItem('tms_user', oldUserData);
        console.log('🔄 Migrated user data to new key format');
      }
    } catch (error) {
      console.warn('⚠️ Error during session data migration:', error);
    }
  }

  /**
   * Check if auto-refresh is disabled due to network errors
   */
  isAutoRefreshDisabled(): boolean {
    return this.networkErrorCount >= this.maxNetworkErrors;
  }

  /**
   * Test connectivity to parent app
   */
  async testConnectivity(): Promise<boolean> {
    try {
      const response = await this.api.get('/api/health', { timeout: 5000 });
      console.log('✅ Parent app connectivity test successful');
      this.resetNetworkErrorCount();
      return true;
    } catch (error) {
      console.log('❌ Parent app connectivity test failed');
      return false;
    }
  }

  /**
   * Logout from parent app
   * Enhanced to support seamless re-authentication
   */
  logout(redirectToParent: boolean = true): void {
    console.log('🔍 Logout initiated, redirectToParent:', redirectToParent);

    // Clear local session first
    this.clearSession();

    if (redirectToParent) {
      const logoutUrl = new URL(
        '/api/auth/child-app/logout',
        process.env.NEXT_PUBLIC_PARENT_APP_URL || 'https://my.jkkn.ac.in'
      );

      // Enhanced logout with seamless re-auth support
      // The parent app will only clear child app session, not parent session
      window.location.href =
        logoutUrl.toString() +
        `?app_id=${
          process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674'
        }&redirect_uri=${encodeURIComponent(
          window.location.origin
        )}&seamless_reauth=true`;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const user = this.getUser();
    return !!(token && user);
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<boolean> {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }

    try {
      const validation = await this.validateToken(token);

      if (validation.valid && validation.user) {
        // Update user data in case it changed
        this.setUser(validation.user);

        if (validation.session) {
          this.setSession(validation.session);
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this.getUser();
    return user?.permissions?.[permission] === true;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getUser();
    return user ? roles.includes(user.role) : false;
  }

  // Token management methods
  getAccessToken(): string | null {
    // Try cookies first, then localStorage as fallback
    let token = Cookies.get('access_token');
    
    if (!token) {
      token = localStorage.getItem('tms_access_token');
      
      // Check if localStorage token is expired
      if (token) {
        const expiresAt = localStorage.getItem('tms_token_expires');
        if (expiresAt && Date.now() > parseInt(expiresAt)) {
          console.log('🕒 Access token in localStorage expired, removing');
          localStorage.removeItem('tms_access_token');
          localStorage.removeItem('tms_token_expires');
          token = null;
        }
      }
    }
    
    return token || null;
  }

  getRefreshToken(): string | null {
    // Try cookies first, then localStorage as fallback
    let token = Cookies.get('refresh_token');
    
    if (!token) {
      token = localStorage.getItem('tms_refresh_token');
      
      // Check if localStorage token is expired
      if (token) {
        const expiresAt = localStorage.getItem('tms_refresh_expires');
        if (expiresAt && Date.now() > parseInt(expiresAt)) {
          console.log('🕒 Refresh token in localStorage expired, removing');
          localStorage.removeItem('tms_refresh_token');
          localStorage.removeItem('tms_refresh_expires');
          token = null;
        }
      }
    }
    
    return token || null;
  }

  private setAccessToken(token: string): void {
    const isProduction = window.location.protocol === 'https:';
    Cookies.set('access_token', token, {
      expires: 1, // 1 day
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/'
    });
    
    // Also store in localStorage as backup
    localStorage.setItem('tms_access_token', token);
    localStorage.setItem('tms_token_expires', (Date.now() + (24 * 60 * 60 * 1000)).toString());
    
    console.log('💾 Access token stored in cookies and localStorage');
  }



  private setRefreshToken(token: string): void {
    const isProduction = window.location.protocol === 'https:';
    Cookies.set('refresh_token', token, {
      expires: 30, // 30 days
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/'
    });
    
    // Also store in localStorage as backup
    localStorage.setItem('tms_refresh_token', token);
    localStorage.setItem('tms_refresh_expires', (Date.now() + (30 * 24 * 60 * 60 * 1000)).toString());
    
    console.log('💾 Refresh token stored in cookies and localStorage');
  }

  getUser(): ParentAppUser | null {
    try {
      // Try new key first, then fallback to old key
      let userData = localStorage.getItem('tms_user') || localStorage.getItem('user_data');
      
      // Handle case where localStorage might contain the string "undefined"
      if (userData && userData !== 'undefined') {
        return JSON.parse(userData) as ParentAppUser;
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  private setUser(user: ParentAppUser): void {
    try {
      // Store in both new and old keys for compatibility
      localStorage.setItem('tms_user', JSON.stringify(user));
      localStorage.setItem('user_data', JSON.stringify(user));
      localStorage.setItem('auth_timestamp', Date.now().toString());
      
      console.log('💾 User data stored in localStorage');
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  // Public method to update user data (for enhanced user objects)
  updateUser(user: ParentAppUser): void {
    this.setUser(user);
  }

  getSession(): AuthSession | null {
    try {
      const sessionData = localStorage.getItem('session_data');
      // Handle case where localStorage might contain the string "undefined"
      if (sessionData && sessionData !== 'undefined') {
        return JSON.parse(sessionData) as AuthSession;
      }
      return null;
    } catch (error) {
      console.error('Error getting session data:', error);
      return null;
    }
  }

  private setSession(session: AuthSession): void {
    try {
      localStorage.setItem('session_data', JSON.stringify(session));
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  }

  clearSession(): void {
    console.log('🧹 Clearing all session data');
    
    // Clear cookies
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    
    // Clear localStorage - both old and new keys
    localStorage.removeItem('user_data');
    localStorage.removeItem('session_data');
    localStorage.removeItem('auth_timestamp');
    localStorage.removeItem('tms_access_token');
    localStorage.removeItem('tms_token_expires');
    localStorage.removeItem('tms_refresh_token');
    localStorage.removeItem('tms_refresh_expires');
    localStorage.removeItem('tms_user');
    localStorage.removeItem('tms_token_expires');
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Reset network error count
    this.networkErrorCount = 0;
    
    console.log('✅ Session cleared completely');
  }

  getApiClient(): AxiosInstance {
    return this.api;
  }

  private generateState(): string {
    // Enhanced state generation with child app context
    const oauthRole = typeof window !== 'undefined' ? sessionStorage.getItem('tms_oauth_role') : null;
    
    const stateData = {
      random:
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15),
      isChildAppAuth: true,
      timestamp: Date.now(),
      appId: process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674',
      // Include OAuth role information to help MYJKKN distinguish flows
      oauthRole: oauthRole || 'passenger',
      userType: oauthRole || 'passenger'
    };

    console.log('🔗 [PARENT AUTH] State data generated:', {
      ...stateData,
      random: stateData.random.substring(0, 10) + '...'
    });

    // Base64 encode without padding (Google strips '=' characters)
    return btoa(JSON.stringify(stateData)).replace(/=/g, '');
  }
}

export default new ParentAuthService();
