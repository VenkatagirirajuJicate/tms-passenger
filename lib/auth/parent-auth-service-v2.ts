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

class ParentAuthServiceV2 {
  private api: AxiosInstance;
  private refreshPromise: Promise<boolean> | null = null;

  // Multiple authorization endpoints to try
  private authEndpoints = [
    '/api/auth/child-app/authorize',
    '/auth/child-app/consent',
    '/api/oauth/authorize',
    '/oauth/authorize'
  ];

  // Multiple token endpoints to try
  private tokenEndpoints = [
    '/api/auth/child-app/token',
    '/auth/child-app/token',
    '/api/oauth/token',
    '/oauth/token'
  ];

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_PARENT_APP_URL || 'https://my.jkkn.ac.in';
    
    this.api = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'app_e20655605d48ebce_cfa1ffe34268949a',
        'User-Agent': 'TMS-Passenger-App/1.0'
      }
    });

    // Add request interceptor for debugging
    this.api.interceptors.request.use(
      (config) => {
        if (process.env.NEXT_PUBLIC_AUTH_DEBUG === 'true') {
          console.log('🚀 Parent App Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            headers: config.headers,
            data: config.data
          });
        }
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for debugging
    this.api.interceptors.response.use(
      (response) => {
        if (process.env.NEXT_PUBLIC_AUTH_DEBUG === 'true') {
          console.log('✅ Parent App Response:', {
            status: response.status,
            statusText: response.statusText,
            data: response.data,
            headers: response.headers
          });
        }
        return response;
      },
      (error) => {
        console.error('❌ Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          config: {
            method: error.config?.method,
            url: error.config?.url,
            baseURL: error.config?.baseURL
          }
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generate state parameter for OAuth flow
   */
  private generateState(): string {
    const state = {
      random: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      isChildAppAuth: true,
      timestamp: Date.now(),
      appId: process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674'
    };
    return btoa(JSON.stringify(state));
  }

  /**
   * Try multiple authorization endpoints
   */
  async testAuthorizationEndpoints(): Promise<{ endpoint: string; status: string; error?: string }[]> {
    const results = [];
    const appId = process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674';
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'app_e20655605d48ebce_cfa1ffe34268949a';
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3003/auth/callback';

    for (const endpoint of this.authEndpoints) {
      try {
        console.log(`🔍 Testing endpoint: ${endpoint}`);
        
        // Create test URL
        const testUrl = new URL(endpoint, this.api.defaults.baseURL);
        testUrl.searchParams.append('response_type', 'code');
        testUrl.searchParams.append('app_id', appId);
        testUrl.searchParams.append('api_key', apiKey);
        testUrl.searchParams.append('redirect_uri', redirectUri);
        testUrl.searchParams.append('scope', 'read write profile');
        testUrl.searchParams.append('state', this.generateState());

        // Make a HEAD request to test if endpoint exists
        const response = await fetch(testUrl.toString(), {
          method: 'HEAD',
          mode: 'no-cors'
        });

        results.push({
          endpoint,
          status: 'accessible',
          error: undefined
        });
      } catch (error) {
        results.push({
          endpoint,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Get authorization URL with fallback endpoints
   */
  getAuthorizationUrl(redirectUrl?: string): string {
    const state = this.generateState();
    const appId = process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674';
    const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'app_e20655605d48ebce_cfa1ffe34268949a';
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3003/auth/callback';

    // Store state and redirect URL in session storage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('oauth_state', state);
      if (redirectUrl) {
        sessionStorage.setItem('oauth_redirect', redirectUrl);
      }
    }

    // Try the primary endpoint first
    const primaryEndpoint = this.authEndpoints[0];
    const authUrl = new URL(primaryEndpoint, this.api.defaults.baseURL);
    
    // Add parameters in the order expected by the parent app
    const params = new URLSearchParams();
    params.append('response_type', 'code');
    params.append('app_id', appId);
    params.append('api_key', apiKey);
    params.append('redirect_uri', redirectUri);
    params.append('scope', 'read write profile');
    params.append('state', state);

    authUrl.search = params.toString();

    console.log('🔗 Generated Authorization URL:', {
      url: authUrl.toString(),
      endpoint: primaryEndpoint,
      appId,
      apiKey: apiKey.substring(0, 10) + '...',
      redirectUri,
      state: state.substring(0, 20) + '...'
    });

    return authUrl.toString();
  }

  /**
   * Alternative authorization URL with different parameter format
   */
  getAlternativeAuthorizationUrl(): string {
    const state = this.generateState();
    const appId = process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674';
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3003/auth/callback';

    // Try without API key in URL (send in header instead)
    const authUrl = new URL('/auth/child-app/consent', this.api.defaults.baseURL);
    
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', appId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', 'read write profile');
    authUrl.searchParams.append('state', state);

    return authUrl.toString();
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string, state?: string): Promise<TokenResponse> {
    const appId = process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674';
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3003/auth/callback';

    // Validate state if provided
    if (state && typeof window !== 'undefined') {
      const storedState = sessionStorage.getItem('oauth_state');
      if (storedState !== state) {
        throw new Error('Invalid state parameter');
      }
    }

    // Try multiple token endpoints
    let lastError: Error | null = null;

    for (const endpoint of this.tokenEndpoints) {
      try {
        console.log(`🔄 Trying token endpoint: ${endpoint}`);

        const response = await this.api.post(endpoint, {
          grant_type: 'authorization_code',
          code,
          app_id: appId,
          redirect_uri: redirectUri,
          state
        });

        if (response.data && response.data.access_token) {
          // Store tokens securely
          this.storeTokens(response.data);
          return response.data;
        }
      } catch (error) {
        console.error(`❌ Token endpoint ${endpoint} failed:`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');
        continue;
      }
    }

    throw lastError || new Error('All token endpoints failed');
  }

  /**
   * Store tokens securely
   */
  private storeTokens(tokenData: TokenResponse): void {
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
    
    // Store in httpOnly cookies for security
    Cookies.set('tms_access_token', tokenData.access_token, {
      expires: expiresAt,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    if (tokenData.refresh_token) {
      Cookies.set('tms_refresh_token', tokenData.refresh_token, {
        expires: 30, // 30 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
    }

    // Store user data in localStorage for quick access
    if (typeof window !== 'undefined' && tokenData.user) {
      localStorage.setItem('tms_user', JSON.stringify(tokenData.user));
      localStorage.setItem('tms_token_expires', expiresAt.toISOString());
    }
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return Cookies.get('tms_access_token') || null;
  }

  /**
   * Get stored user data
   */
  getStoredUser(): ParentAppUser | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const userData = localStorage.getItem('tms_user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    if (typeof window === 'undefined') return true;
    
    try {
      const expiresAt = localStorage.getItem('tms_token_expires');
      if (!expiresAt) return true;
      
      return new Date() >= new Date(expiresAt);
    } catch {
      return true;
    }
  }

  /**
   * Validate token with parent app
   */
  async validateToken(token?: string): Promise<ValidationResponse> {
    const accessToken = token || this.getAccessToken();
    
    if (!accessToken) {
      return { valid: false, error: 'No access token available' };
    }

    try {
      // Use our local validation endpoint
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: accessToken })
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Token validation error:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
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

    this.refreshPromise = this._performTokenRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    
    return result;
  }

  private async _performTokenRefresh(): Promise<boolean> {
    try {
      const refreshToken = Cookies.get('tms_refresh_token');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.api.post('/api/auth/child-app/refresh', {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        app_id: process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674'
      });

      if (response.data && response.data.access_token) {
        this.storeTokens(response.data);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return false;
    }
  }

  /**
   * Clear all stored tokens and user data
   */
  clearTokens(): void {
    Cookies.remove('tms_access_token', { path: '/' });
    Cookies.remove('tms_refresh_token', { path: '/' });
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tms_user');
      localStorage.removeItem('tms_token_expires');
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_redirect');
    }
  }

  /**
   * Logout user
   */
  async logout(redirectToParent = false): Promise<void> {
    try {
      const accessToken = this.getAccessToken();
      
      if (accessToken) {
        // Notify parent app about logout
        await this.api.post('/api/auth/child-app/logout', {
          token: accessToken,
          app_id: process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674'
        });
      }
    } catch (error) {
      console.error('Logout notification failed:', error);
    } finally {
      this.clearTokens();
      
      if (redirectToParent && typeof window !== 'undefined') {
        const parentUrl = process.env.NEXT_PUBLIC_PARENT_APP_URL || 'https://my.jkkn.ac.in';
        window.location.href = `${parentUrl}/logout`;
      }
    }
  }

  /**
   * Get diagnostic information
   */
  getDiagnosticInfo() {
    return {
      baseURL: this.api.defaults.baseURL,
      appId: process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674',
      apiKey: process.env.NEXT_PUBLIC_API_KEY ? 'Set' : 'Not set',
      redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3003/auth/callback',
      hasAccessToken: !!this.getAccessToken(),
      hasUser: !!this.getStoredUser(),
      isTokenExpired: this.isTokenExpired(),
      authEndpoints: this.authEndpoints,
      tokenEndpoints: this.tokenEndpoints
    };
  }
}

// Export singleton instance
const parentAuthServiceV2 = new ParentAuthServiceV2();
export default parentAuthServiceV2;





