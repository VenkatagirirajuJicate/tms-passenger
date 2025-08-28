import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

// Debug version of parent auth service with multiple endpoint attempts
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

export interface ValidationResponse {
  valid: boolean;
  user?: ParentAppUser;
  session?: AuthSession;
  error?: string;
}

class ParentAuthServiceDebug {
  private api: AxiosInstance;
  private refreshPromise: Promise<boolean> | null = null;

  // Different authorization endpoints to try
  private authEndpoints = [
    '/api/auth/child-app/authorize',
    '/auth/child-app/consent',
    '/oauth/authorize',
    '/api/oauth/child-app/authorize',
    '/auth/oauth/child-app/authorize'
  ];

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_PARENT_APP_URL || 'https://my.jkkn.ac.in';
    
    this.api = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'app_e20655605d48ebce_cfa1ffe34268949a'
      }
    });

    // Request interceptor for debugging
    this.api.interceptors.request.use(
      (config) => {
        console.log('🚀 Parent App Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          headers: config.headers,
          data: config.data
        });
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for debugging
    this.api.interceptors.response.use(
      (response) => {
        console.log('✅ Parent App Response:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          headers: response.headers
        });
        return response;
      },
      (error) => {
        console.error('❌ Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Test different authorization endpoints
   */
  async testAuthEndpoints(): Promise<void> {
    console.log('🧪 Testing authorization endpoints...');
    
    for (const endpoint of this.authEndpoints) {
      try {
        console.log(`\n🔍 Testing endpoint: ${endpoint}`);
        
        const testUrl = new URL(endpoint, this.api.defaults.baseURL);
        testUrl.searchParams.append('response_type', 'code');
        testUrl.searchParams.append('app_id', process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674');
        testUrl.searchParams.append('redirect_uri', process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3003/auth/callback');
        testUrl.searchParams.append('scope', 'read');
        testUrl.searchParams.append('state', 'test-state');

        console.log(`📍 Full URL: ${testUrl.toString()}`);

        // Test with fetch to avoid CORS issues
        const response = await fetch(testUrl.toString(), {
          method: 'GET',
          headers: {
            'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'app_e20655605d48ebce_cfa1ffe34268949a'
          }
        });

        console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          console.log(`✅ Endpoint ${endpoint} works!`);
          const text = await response.text();
          console.log(`📄 Response preview: ${text.substring(0, 200)}...`);
        } else {
          const errorText = await response.text();
          console.log(`❌ Endpoint ${endpoint} failed: ${errorText}`);
        }

      } catch (error) {
        console.error(`💥 Error testing ${endpoint}:`, error);
      }
    }
  }

  /**
   * Login with debug information
   */
  login(redirectUrl?: string): void {
    console.log('🔐 Starting parent app login...');
    
    // Store redirect URL for post-login
    if (redirectUrl) {
      sessionStorage.setItem('post_login_redirect', redirectUrl);
    }

    // Generate state for CSRF protection
    const state = this.generateState();
    sessionStorage.setItem('oauth_state', state);

    // Try the first endpoint (most likely to work)
    const authUrl = new URL(
      this.authEndpoints[0],
      process.env.NEXT_PUBLIC_PARENT_APP_URL || 'https://my.jkkn.ac.in'
    );

    // Add parameters with different variations
    const params = [
      ['response_type', 'code'],
      ['app_id', process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674'],
      ['client_id', process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674'], // Try both
      ['api_key', process.env.NEXT_PUBLIC_API_KEY || 'app_e20655605d48ebce_cfa1ffe34268949a'],
      ['redirect_uri', process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3003/auth/callback'],
      ['scope', 'read write profile'],
      ['state', state]
    ];

    params.forEach(([key, value]) => {
      authUrl.searchParams.append(key, value);
    });

    console.log('🌐 Redirecting to:', authUrl.toString());
    console.log('📋 Parameters:', Object.fromEntries(authUrl.searchParams));

    // Test the endpoint before redirecting
    this.testAuthEndpoints().then(() => {
      console.log('🚀 Redirecting to parent app...');
      window.location.href = authUrl.toString();
    }).catch((error) => {
      console.error('❌ Pre-redirect test failed:', error);
      // Redirect anyway
      window.location.href = authUrl.toString();
    });
  }

  /**
   * Generate OAuth state parameter
   */
  private generateState(): string {
    const randomString = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
    
    return btoa(JSON.stringify({
      random: randomString,
      isChildAppAuth: true,
      timestamp: Date.now(),
      appId: process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674'
    }));
  }

  // ... rest of the methods remain the same as original service
  
  getUser(): ParentAppUser | null {
    const userData = localStorage.getItem('parent_app_user');
    return userData ? JSON.parse(userData) : null;
  }

  getSession(): AuthSession | null {
    const sessionData = localStorage.getItem('parent_app_session');
    return sessionData ? JSON.parse(sessionData) : null;
  }

  getAccessToken(): string | null {
    return localStorage.getItem('parent_app_access_token');
  }

  clearSession(): void {
    localStorage.removeItem('parent_app_user');
    localStorage.removeItem('parent_app_session');
    localStorage.removeItem('parent_app_access_token');
    localStorage.removeItem('parent_app_refresh_token');
    Cookies.remove('parent_app_session');
  }

  private setUser(user: ParentAppUser): void {
    localStorage.setItem('parent_app_user', JSON.stringify(user));
  }

  private setSession(session: AuthSession): void {
    localStorage.setItem('parent_app_session', JSON.stringify(session));
  }

  private setAccessToken(token: string): void {
    localStorage.setItem('parent_app_access_token', token);
  }

  private setRefreshToken(token: string): void {
    localStorage.setItem('parent_app_refresh_token', token);
  }
}

// Export singleton instance
const parentAuthServiceDebug = new ParentAuthServiceDebug();
export default parentAuthServiceDebug;





