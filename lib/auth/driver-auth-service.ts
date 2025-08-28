import Cookies from 'js-cookie';

export interface DriverUser {
  id: string;
  email: string;
  driver_name: string;
  phone?: string;
  rating?: number;
  role: 'driver';
}

export interface DriverSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface DriverAuthData {
  user: DriverUser;
  driver: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    rating?: number;
  };
  session: DriverSession;
}

class DriverAuthService {
  private storageKey = 'tms_driver_user';
  private sessionKey = 'tms_driver_session';
  private driverKey = 'tms_driver_data';
  
  /**
   * Login driver with email and password (database auth)
   */
  async login(email: string, password: string): Promise<DriverAuthData | null> {
    try {
      const response = await fetch('/api/auth/driver-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      // Store driver data
      this.storeAuthData(data);
      
      return data;
    } catch (error) {
      console.error('Driver login error:', error);
      throw error;
    }
  }

  /**
   * Direct login driver with email and password (with parent app integration)
   */
  async directLogin(email: string, password: string): Promise<DriverAuthData | null> {
    try {
      const response = await fetch('/api/auth/driver-direct-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email, 
          password,
          app_id: process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674',
          api_key: process.env.NEXT_PUBLIC_API_KEY || 'app_e20655605d48ebce_cfa1ffe34268949a'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Direct login failed');
      }

      const data = await response.json();
      
      // Transform response to match expected format
      const transformedData: DriverAuthData = {
        user: {
          id: data.user.id,
          email: data.user.email,
          driver_name: data.user.user_metadata?.driver_name || data.user.full_name || 'Driver',
          phone: data.driver?.phone,
          rating: data.driver?.rating || 0,
          role: 'driver'
        },
        driver: data.driver,
        session: {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.session?.expires_at || Date.now() + (24 * 60 * 60 * 1000)
        }
      };
      
      // Store driver data
      this.storeAuthData(transformedData);
      
      return transformedData;
    } catch (error) {
      console.error('Driver direct login error:', error);
      throw error;
    }
  }

  /**
   * Store driver authentication data
   */
  storeAuthData(data: DriverAuthData): void {
    if (typeof window === 'undefined') return;

    // Store in localStorage
    localStorage.setItem(this.storageKey, JSON.stringify(data.user));
    localStorage.setItem(this.driverKey, JSON.stringify(data.driver));
    localStorage.setItem(this.sessionKey, JSON.stringify(data.session));

    // Store in cookies for server-side access
    document.cookie = `tms_access_token=${data.session.access_token}; path=/; max-age=${24 * 3600}`;
    document.cookie = `tms_refresh_token=${data.session.refresh_token}; path=/; max-age=${30 * 24 * 3600}`;
  }

  /**
   * Get stored driver user
   */
  getUser(): DriverUser | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const storedUser = localStorage.getItem(this.storageKey);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  }

  /**
   * Get stored driver session
   */
  getSession(): DriverSession | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const storedSession = localStorage.getItem(this.sessionKey);
      return storedSession ? JSON.parse(storedSession) : null;
    } catch {
      return null;
    }
  }

  /**
   * Get stored driver data
   */
  getDriverData(): DriverAuthData['driver'] | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const storedDriver = localStorage.getItem(this.driverKey);
      return storedDriver ? JSON.parse(storedDriver) : null;
    } catch {
      return null;
    }
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return Cookies.get('tms_access_token') || null;
  }

  /**
   * Check if driver is authenticated
   */
  isAuthenticated(): boolean {
    const user = this.getUser();
    const session = this.getSession();
    const token = this.getAccessToken();
    
    if (!user || !session || !token) {
      return false;
    }

    // Check if token is expired
    if (session.expires_at < Date.now()) {
      this.logout();
      return false;
    }

    return true;
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<boolean> {
    const session = this.getSession();
    const user = this.getUser();
    
    if (!session || !user) {
      return false;
    }

    // Check expiry
    if (session.expires_at < Date.now()) {
      this.logout();
      return false;
    }

    // For now, assume valid if not expired
    // In a real implementation, you might want to validate with the server
    return true;
  }

  /**
   * Refresh driver session
   */
  async refreshSession(): Promise<boolean> {
    try {
      const session = this.getSession();
      
      if (!session?.refresh_token) {
        return false;
      }

      // For now, just extend the expiry
      // In a real implementation, you would call a refresh endpoint
      const newExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      const updatedSession = {
        ...session,
        expires_at: newExpiry
      };

      localStorage.setItem(this.sessionKey, JSON.stringify(updatedSession));
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if user has specific role (drivers always have 'driver' role)
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

  /**
   * Logout driver
   */
  logout(): void {
    if (typeof window === 'undefined') return;

    // Clear localStorage
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.sessionKey);
    localStorage.removeItem(this.driverKey);

    // Clear cookies
    document.cookie = 'tms_access_token=; path=/; max-age=0';
    document.cookie = 'tms_refresh_token=; path=/; max-age=0';
  }

  /**
   * Update user data
   */
  updateUser(user: DriverUser): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(user));
  }
}

// Export singleton instance
const driverAuthService = new DriverAuthService();
export default driverAuthService;
