import parentAuthService, { ParentAppUser, AuthSession } from './parent-auth-service';
import driverAuthService, { DriverUser, DriverSession, DriverAuthData } from './driver-auth-service';
import { sessionManager } from '../session';

export type UnifiedUser = ParentAppUser | DriverUser;

export interface UnifiedAuthState {
  user: UnifiedUser | null;
  session: AuthSession | DriverSession | null;
  isAuthenticated: boolean;
  userType: 'passenger' | 'driver' | null;
}

export interface LoginResult {
  success: boolean;
  userType: 'passenger' | 'driver';
  redirectPath: string;
  error?: string;
}

class UnifiedAuthService {
  
  /**
   * Check current authentication state
   */
  getCurrentAuthState(): UnifiedAuthState {
    // Check for driver authentication first
    const driverUser = driverAuthService.getUser();
    const driverSession = driverAuthService.getSession();
    
    if (driverUser && driverSession && driverAuthService.isAuthenticated()) {
      return {
        user: driverUser,
        session: driverSession,
        isAuthenticated: true,
        userType: 'driver'
      };
    }

    // Check for passenger authentication
    const passengerUser = parentAuthService.getUser();
    const passengerSession = parentAuthService.getSession();
    
    if (passengerUser && passengerSession) {
      return {
        user: passengerUser,
        session: passengerSession,
        isAuthenticated: true,
        userType: 'passenger'
      };
    }

    return {
      user: null,
      session: null,
      isAuthenticated: false,
      userType: null
    };
  }

  /**
   * Determine if user is a driver based on strict criteria
   */
  isDriver(user: UnifiedUser): boolean {
    // Check for explicit driver role - this is the primary check
    if ('role' in user && user.role === 'driver') {
      return true;
    }

    // Check if user has driver-specific authentication data
    // This ensures only users who went through driver auth flow are considered drivers
    if ('driver_id' in user && user.driver_id) {
      return true;
    }

    // Check for driver metadata from driver auth service
    if ('user_metadata' in user && user.user_metadata?.driver_id) {
      return true;
    }

    // Additional safety check: ensure user has driver-specific fields
    // This prevents passengers from being misidentified as drivers
    if ('driver_name' in user && user.driver_name && 'role' in user && user.role === 'driver') {
      return true;
    }

    return false;
  }

  /**
   * Get appropriate dashboard path based on user type
   */
  getDashboardPath(user: UnifiedUser): string {
    return this.isDriver(user) ? '/driver' : '/dashboard';
  }

  /**
   * Login driver with email/password (database auth)
   */
  async loginDriver(email: string, password: string): Promise<LoginResult> {
    try {
      const authData = await driverAuthService.login(email, password);
      
      if (authData) {
        // Also store in sessionManager for compatibility
        const sessionData = {
          user: {
            id: authData.user.id,
            email: authData.user.email,
            user_metadata: {
              driver_id: authData.driver.id,
              driver_name: authData.driver.name
            }
          },
          session: {
            access_token: authData.session.access_token,
            expires_at: authData.session.expires_at,
            refresh_token: authData.session.refresh_token
          }
        };
        sessionManager.setSession(sessionData);

        return {
          success: true,
          userType: 'driver',
          redirectPath: '/driver'
        };
      }

      return {
        success: false,
        userType: 'driver',
        redirectPath: '/login',
        error: 'Login failed'
      };
    } catch (error) {
      return {
        success: false,
        userType: 'driver', 
        redirectPath: '/login',
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  /**
   * Direct login driver with email/password (with parent app integration)
   */
  async loginDriverDirect(email: string, password: string): Promise<LoginResult> {
    try {
      const authData = await driverAuthService.directLogin(email, password);
      
      if (authData) {
        // Also store in sessionManager for compatibility
        const sessionData = {
          user: {
            id: authData.user.id,
            email: authData.user.email,
            user_metadata: {
              driver_id: authData.driver.id,
              driver_name: authData.driver.name || authData.user.driver_name
            }
          },
          session: {
            access_token: authData.session.access_token,
            expires_at: authData.session.expires_at,
            refresh_token: authData.session.refresh_token
          }
        };
        sessionManager.setSession(sessionData);

        return {
          success: true,
          userType: 'driver',
          redirectPath: '/driver'
        };
      }

      return {
        success: false,
        userType: 'driver',
        redirectPath: '/login',
        error: 'Direct login failed'
      };
    } catch (error) {
      return {
        success: false,
        userType: 'driver', 
        redirectPath: '/login',
        error: error instanceof Error ? error.message : 'Direct login failed'
      };
    }
  }

  /**
   * Login passenger via parent app OAuth
   */
  loginPassenger(redirectUrl?: string): void {
    // Start debug session for passenger OAuth
    import('./oauth-debug-service').then(({ oauthDebugService }) => {
      oauthDebugService.startSession('passenger');
    });
    parentAuthService.login(redirectUrl);
  }

  /**
   * Login driver via parent app OAuth (with role validation)
   */
  loginDriverOAuth(redirectUrl?: string): void {
    console.log('🚗 [DRIVER OAUTH] Step 1: Initiating driver OAuth login');
    console.log('🚗 [DRIVER OAUTH] Redirect URL:', redirectUrl || 'default');
    
    // Start debug session for driver OAuth
    import('./oauth-debug-service').then(({ oauthDebugService }) => {
      oauthDebugService.startSession('driver', 'arthanareswaran22@jkkn.ac.in');
    });
    
    // Store that this is a driver OAuth attempt for callback processing
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tms_oauth_role', 'driver');
      console.log('🚗 [DRIVER OAUTH] Step 2: Driver OAuth flag set in sessionStorage');
      console.log('🚗 [DRIVER OAUTH] Session storage state:', {
        tms_oauth_role: sessionStorage.getItem('tms_oauth_role'),
        post_login_redirect: sessionStorage.getItem('post_login_redirect')
      });
    }
    
    console.log('🚗 [DRIVER OAUTH] Step 3: Calling parent auth service login');
    parentAuthService.login(redirectUrl);
  }

  /**
   * Validate current session based on user type
   */
  async validateSession(): Promise<boolean> {
    const authState = this.getCurrentAuthState();
    
    if (!authState.isAuthenticated) {
      return false;
    }

    if (authState.userType === 'driver') {
      return await driverAuthService.validateSession();
    } else if (authState.userType === 'passenger') {
      return await parentAuthService.validateSession();
    }

    return false;
  }

  /**
   * Refresh current session based on user type  
   */
  async refreshSession(): Promise<boolean> {
    const authState = this.getCurrentAuthState();
    
    if (!authState.isAuthenticated) {
      return false;
    }

    if (authState.userType === 'driver') {
      return await driverAuthService.refreshSession();
    } else if (authState.userType === 'passenger') {
      return await parentAuthService.refreshToken();
    }

    return false;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const authState = this.getCurrentAuthState();
    
    if (!authState.isAuthenticated || !authState.user) {
      return false;
    }

    if (authState.userType === 'driver') {
      return driverAuthService.hasRole(role);
    } else if (authState.userType === 'passenger') {
      return parentAuthService.hasRole(role);
    }

    return false;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const authState = this.getCurrentAuthState();
    
    if (!authState.isAuthenticated || !authState.user) {
      return false;
    }

    if (authState.userType === 'driver') {
      return driverAuthService.hasAnyRole(roles);
    } else if (authState.userType === 'passenger') {
      return parentAuthService.hasAnyRole(roles);
    }

    return false;
  }

  /**
   * Check if user has specific permission (passengers only)
   */
  hasPermission(permission: string): boolean {
    const authState = this.getCurrentAuthState();
    
    if (!authState.isAuthenticated || !authState.user) {
      return false;
    }

    if (authState.userType === 'passenger') {
      return parentAuthService.hasPermission(permission);
    }

    // Drivers don't have granular permissions by default
    return false;
  }

  /**
   * Logout user based on current auth type
   */
  logout(redirectToParent?: boolean): void {
    const authState = this.getCurrentAuthState();
    
    if (authState.userType === 'driver') {
      driverAuthService.logout();
    } else if (authState.userType === 'passenger') {
      parentAuthService.logout(redirectToParent);
    }

    // Clear sessionManager as well
    sessionManager.clearSession();
  }

  /**
   * Get access token from current auth method
   */
  getAccessToken(): string | null {
    const authState = this.getCurrentAuthState();
    
    if (authState.userType === 'driver') {
      return driverAuthService.getAccessToken();
    } else if (authState.userType === 'passenger') {
      return parentAuthService.getAccessToken();
    }

    return null;
  }

  /**
   * Attempt auto-login for both driver and passenger
   */
  async attemptAutoLogin(): Promise<UnifiedAuthState> {
    console.log('🔄 Unified auto-login: Starting authentication check...');
    
    // Check driver authentication first
    if (driverAuthService.isAuthenticated()) {
      console.log('🔄 Unified auto-login: Found driver session, validating...');
      const isValid = await driverAuthService.validateSession();
      if (isValid) {
        console.log('✅ Unified auto-login: Driver session valid');
        return this.getCurrentAuthState();
      } else {
        console.log('❌ Unified auto-login: Driver session invalid, clearing');
        driverAuthService.logout();
      }
    }

    // Check passenger authentication with enhanced auto-login
    const passengerUser = parentAuthService.getUser();
    const passengerAccessToken = parentAuthService.getAccessToken();
    
    console.log('🔄 Unified auto-login: Passenger data check:', {
      hasUser: !!passengerUser,
      hasToken: !!passengerAccessToken,
      userEmail: passengerUser?.email
    });
    
    if (passengerUser && passengerAccessToken) {
      console.log('🔄 Unified auto-login: Found passenger session, validating...');
      
      try {
        const isValid = await parentAuthService.validateSession();
        if (isValid) {
          console.log('✅ Unified auto-login: Passenger session valid');
          return this.getCurrentAuthState();
        } else {
          console.log('❌ Unified auto-login: Passenger session invalid');
          
          // Try refresh token before giving up
          const refreshToken = parentAuthService.getRefreshToken();
          if (refreshToken) {
            console.log('🔄 Unified auto-login: Attempting token refresh...');
            const refreshed = await parentAuthService.refreshToken();
            if (refreshed) {
              console.log('✅ Unified auto-login: Token refresh successful');
              return this.getCurrentAuthState();
            } else {
              console.log('❌ Unified auto-login: Token refresh failed, clearing session');
            }
          }
          
          parentAuthService.clearSession();
        }
      } catch (error) {
        console.error('❌ Unified auto-login: Validation error:', error);
        parentAuthService.clearSession();
      }
    }

    console.log('❌ Unified auto-login: No valid sessions found');
    return {
      user: null,
      session: null,
      isAuthenticated: false,
      userType: null
    };
  }
}

// Export singleton instance
const unifiedAuthService = new UnifiedAuthService();
export default unifiedAuthService;
