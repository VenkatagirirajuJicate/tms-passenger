'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react';
import parentAuthService, {
  ParentAppUser,
  AuthSession
} from './parent-auth-service';
import { ParentAppIntegrationService } from './parent-app-integration';
import unifiedAuthService, { UnifiedUser } from './unified-auth-service';
import driverAuthService from './driver-auth-service';
import { sessionManager } from '../session';
import { AutoLoginService } from './auto-login-service';

interface AuthContextType {
  user: UnifiedUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  userType: 'passenger' | 'driver' | null;
  login: (redirectUrl?: string) => void;
  loginDriver: (email: string, password: string) => Promise<boolean>;
  loginDriverDirect: (email: string, password: string) => Promise<boolean>;
  loginDriverOAuth: (redirectUrl?: string) => void;
  logout: (redirectToParent?: boolean) => void;
  refreshSession: () => Promise<boolean>;
  validateSession: () => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  handleAuthCallback: (
    token: string,
    refreshToken?: string
  ) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  autoValidate?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onAuthChange?: (user: UnifiedUser | null) => void;
  onSessionExpired?: () => void;
}

export function AuthProvider({
  children,
  autoValidate = true,
  autoRefresh = true,
  refreshInterval = 10 * 60 * 1000, // 10 minutes
  onAuthChange,
  onSessionExpired
}: AuthProviderProps) {
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<'passenger' | 'driver' | null>(null);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔄 Auth initialization - checking unified auth state...');
        
        // Get current auth state from unified service
        const authState = await unifiedAuthService.attemptAutoLogin();
        
        console.log('🔄 Auth initialization result:', {
          isAuthenticated: authState.isAuthenticated,
          userType: authState.userType,
          userEmail: authState.user?.email
        });

        if (authState.isAuthenticated && authState.user) {
          setUser(authState.user);
          setSession(authState.session as AuthSession);
          setUserType(authState.userType);

          // For passenger users, check if user object needs enhancement (missing studentId)
          if (authState.userType === 'passenger' && authState.user && 'studentId' in authState.user && !authState.user.studentId && authState.user.email) {
            console.log('🔧 Passenger user object missing enhanced data, attempting to enhance...');
            try {
              const integrationResult = await ParentAppIntegrationService.findOrCreateStudentFromParentApp(authState.user as ParentAppUser);
              
              if (integrationResult && integrationResult.student) {
                const { student, isNewStudent } = integrationResult;
                console.log('✅ Enhanced user object during initialization:', {
                  studentId: student.id,
                  email: student.email,
                  rollNumber: student.roll_number
                });

                const enhancedUser = {
                  ...authState.user,
                  studentId: student.id,
                  rollNumber: student.roll_number,
                  isNewStudent,
                  departmentId: student.department_id,
                  programId: student.program_id,
                  profileCompletionPercentage: student.profile_completion_percentage
                } as ParentAppUser;

                // Store the enhanced user
                parentAuthService.updateUser(enhancedUser);
                setUser(enhancedUser);
                
                // Also store in sessionManager format for compatibility
                if (authState.session && enhancedUser.studentId) {
                  const sessionData = {
                    user: {
                      id: enhancedUser.id,
                      email: enhancedUser.email,
                      user_metadata: {
                        student_id: enhancedUser.studentId,
                        student_name: enhancedUser.full_name,
                        roll_number: enhancedUser.rollNumber
                      }
                    },
                    session: {
                      access_token: parentAuthService.getAccessToken() || '',
                      expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
                      refresh_token: parentAuthService.getRefreshToken() || ''
                    }
                  };
                  sessionManager.setSession(sessionData as any);
                  console.log('✅ Session stored in sessionManager during initialization for student:', enhancedUser.studentId);
                }
              }
            } catch (error) {
              console.warn('⚠️ Error enhancing user object:', error);
            }
          }

          // Additional validation if enabled
          if (autoValidate) {
            const isValid = await unifiedAuthService.validateSession();
            if (!isValid) {
              console.log('❌ Session validation failed, clearing auth state');
              setUser(null);
              setSession(null);
              setUserType(null);
            }
          }
        } else {
          console.log('❌ No authenticated user found');
          setUser(null);
          setSession(null);
          setUserType(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Failed to initialize authentication');
        setUser(null);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [autoValidate]);

  // Auto-refresh token
  useEffect(() => {
    if (!autoRefresh || !user || !session) return;

    const refreshTimer = setInterval(async () => {
      try {
        console.log('🔄 Auto-refresh timer triggered');
        const refreshed = await parentAuthService.refreshToken();
        if (refreshed) {
          const freshUser = parentAuthService.getUser();
          const freshSession = parentAuthService.getSession();
          setUser(freshUser);
          setSession(freshSession);
          console.log('✅ Auto-refresh successful');
        } else {
          console.warn('⚠️ Auto-refresh failed - checking if session should be cleared');
          
          // Check if this is a network error vs authentication error
          // For network errors, we keep the session and retry later
          const currentUser = parentAuthService.getUser();
          if (!currentUser) {
            // Only clear session if the service itself cleared it (auth error)
            console.log('🔒 Session cleared by auth service - logging out');
            setUser(null);
            setSession(null);
            if (onSessionExpired) {
              onSessionExpired();
            }
          } else {
            console.log('🌐 Keeping session active despite refresh failure (likely network issue)');
          }
        }
      } catch (err: any) {
        console.error('❌ Auto-refresh error:', {
          message: err.message,
          code: err.code,
          isNetworkError: err.code === 'NETWORK_ERROR' || err.message === 'Network Error'
        });
        
        // Don't clear session for network errors
        if (!(err.code === 'NETWORK_ERROR' || err.message === 'Network Error')) {
          console.log('🔒 Non-network error in auto-refresh - clearing session');
          setUser(null);
          setSession(null);
          if (onSessionExpired) {
            onSessionExpired();
          }
        } else {
          console.log('🌐 Network error in auto-refresh - keeping session');
        }
      }
    }, refreshInterval);

    return () => clearInterval(refreshTimer);
  }, [autoRefresh, user, session, refreshInterval, onSessionExpired]);

  // Notify auth changes
  useEffect(() => {
    if (onAuthChange) {
      onAuthChange(user);
    }
  }, [user, onAuthChange]);

  // Check auth callback params on mount
  useEffect(() => {
    const checkAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const refreshToken = params.get('refresh_token');

      // Skip if we're on the callback page (it will handle itself)
      if (window.location.pathname === '/auth/callback') {
        return;
      }

      if (token) {
        try {
          setIsLoading(true);
          const authUser = await parentAuthService.handleCallback(
            token,
            refreshToken || undefined
          );

          if (authUser) {
            setUser(authUser);
            const newSession = parentAuthService.getSession();
            setSession(newSession);

            // Clean URL
            const url = new URL(window.location.href);
            url.searchParams.delete('token');
            url.searchParams.delete('refresh_token');
            window.history.replaceState({}, '', url.toString());

            // Handle post-login redirect
            const redirectUrl = sessionStorage.getItem('post_login_redirect');
            if (redirectUrl) {
              sessionStorage.removeItem('post_login_redirect');
              window.location.href = redirectUrl;
              return;
            }
          }
        } catch (err) {
          console.error('Auth callback error:', err);
          setError('Authentication failed');
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkAuthCallback();
  }, []);

  const login = (redirectUrl?: string) => {
    unifiedAuthService.loginPassenger(redirectUrl);
  };

  const loginDriverOAuth = (redirectUrl?: string) => {
    unifiedAuthService.loginDriverOAuth(redirectUrl);
  };

  const loginDriver = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await unifiedAuthService.loginDriver(email, password);
      
      if (result.success) {
        // Update state with driver user
        const authState = unifiedAuthService.getCurrentAuthState();
        setUser(authState.user);
        setSession(authState.session as AuthSession);
        setUserType(authState.userType);
        
        console.log('✅ Driver login successful:', result);
        return true;
      } else {
        setError(result.error || 'Driver login failed');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Driver login failed';
      setError(errorMessage);
      console.error('❌ Driver login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginDriverDirect = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await unifiedAuthService.loginDriverDirect(email, password);
      
      if (result.success) {
        // Update state with driver user
        const authState = unifiedAuthService.getCurrentAuthState();
        setUser(authState.user);
        setSession(authState.session as AuthSession);
        setUserType(authState.userType);
        
        console.log('✅ Driver direct login successful:', result);
        return true;
      } else {
        setError(result.error || 'Driver direct login failed');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Driver direct login failed';
      setError(errorMessage);
      console.error('❌ Driver direct login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (redirectToParent: boolean = false) => {
    console.log('🔍 Logout initiated, userType:', userType, 'redirectToParent:', redirectToParent);

    try {
      // Use unified auth service to handle logout based on user type
      unifiedAuthService.logout(redirectToParent);

      // Clear local state
      setUser(null);
      setSession(null);
      setUserType(null);
      setError(null);

      // Reset auto-login state to prevent automatic re-login
      try {
        AutoLoginService.getInstance().resetAutoLoginState();
      } catch (error) {
        console.warn('Could not reset auto-login state:', error);
      }

      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Clear local state even if logout fails
      setUser(null);
      setSession(null);
      setUserType(null);
      setError(null);
    }

    // Redirect appropriately
    if (redirectToParent) {
      window.location.href =
        process.env.NEXT_PUBLIC_PARENT_APP_URL || 'https://my.jkkn.ac.in';
    } else {
      window.location.href = '/login';
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      const success = await unifiedAuthService.refreshSession();
      if (success) {
        // Update state with fresh data
        const authState = unifiedAuthService.getCurrentAuthState();
        setUser(authState.user);
        setSession(authState.session as AuthSession);
        setUserType(authState.userType);
      } else {
        // Clear state if refresh failed
        setUser(null);
        setSession(null);
        setUserType(null);
      }
      return success;
    } catch (err) {
      console.error('Refresh session error:', err);
      setUser(null);
      setSession(null);
      setUserType(null);
      return false;
    }
  };

  const validateSession = async (): Promise<boolean> => {
    try {
      const isValid = await unifiedAuthService.validateSession();
      if (isValid) {
        // Update state with fresh data
        const authState = unifiedAuthService.getCurrentAuthState();
        setUser(authState.user);
        setSession(authState.session as AuthSession);
        setUserType(authState.userType);
      } else {
        setUser(null);
        setSession(null);
        setUserType(null);
      }
      return isValid;
    } catch (err) {
      console.error('Validate session error:', err);
      setUser(null);
      setSession(null);
      setUserType(null);
      return false;
    }
  };

  const handleAuthCallback = async (
    token: string,
    refreshToken?: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Import debug service and log callback received
      const { oauthDebugService } = await import('@/lib/auth/oauth-debug-service');
      oauthDebugService.logStep(6, 'Callback Received', 'completed', {
        hasToken: !!token,
        hasRefreshToken: !!refreshToken,
        tokenLength: token?.length,
        timestamp: new Date().toISOString()
      });

      oauthDebugService.logStep(7, 'Token Exchange', 'in-progress');

      // Check if this is a driver OAuth attempt
      const isDriverOAuth = typeof window !== 'undefined' && 
        sessionStorage.getItem('tms_oauth_role') === 'driver';
      
      console.log('🔐 [AUTH CONTEXT] Step 17: Processing authentication callback');
      console.log('🔐 [AUTH CONTEXT] Callback details:', {
        hasToken: !!token,
        hasRefreshToken: !!refreshToken,
        isDriverOAuth,
        tokenLength: token?.length,
        timestamp: new Date().toISOString()
      });

      console.log('🔐 [AUTH CONTEXT] Step 18: Calling parent auth service handleCallback');
      const authUser = await parentAuthService.handleCallback(
        token,
        refreshToken
      );
      
      console.log('🔐 [AUTH CONTEXT] Step 19: Parent auth service response received');
      console.log('🔐 [AUTH CONTEXT] Auth user details:', {
        hasUser: !!authUser,
        userEmail: authUser?.email,
        userRole: authUser?.role,
        userFullName: authUser?.full_name
      });

      if (!authUser) {
        oauthDebugService.logStep(7, 'Token Exchange', 'failed', null, 'Failed to get user data from parent app');
        oauthDebugService.endSession('failure', 'Token exchange failed - no user returned');
        return false;
      }

      oauthDebugService.logStep(7, 'Token Exchange', 'completed');
      oauthDebugService.logStep(8, 'User Data Retrieved', 'completed', {
        userEmail: authUser.email,
        userRole: authUser.role,
        userFullName: authUser.full_name,
        userPermissions: authUser.permissions
      });

      oauthDebugService.logStep(9, 'Role Validation', 'in-progress', {
        isDriverOAuth,
        userRole: authUser.role
      });

      if (authUser && isDriverOAuth) {
        console.log('🔐 [AUTH CONTEXT] Step 20: Processing driver OAuth validation');
        // Enhanced role debugging for driver OAuth
        console.log('🔐 [AUTH CONTEXT] Driver OAuth - Detailed user info from parent app:', {
          email: authUser.email,
          role: authUser.role,
          fullName: authUser.full_name,
          permissions: authUser.permissions,
          allUserData: authUser
        });

        // For the specific user arthanareswaran22@jkkn.ac.in, allow access regardless of role
        // This is a temporary fix while we determine the correct role from parent app
        const isTargetDriverUser = authUser.email === 'arthanareswaran22@jkkn.ac.in';
        
        // Validate that the user has driver role or is the target user
        const hasDriverRole = 
          isTargetDriverUser || // Allow specific user for testing
          authUser.role === 'driver' || 
          authUser.role === 'transport_staff' ||
          authUser.role === 'staff' ||
          authUser.role === 'employee' ||
          authUser.role === 'transport_employee' ||
          authUser.role === 'transport' ||
          authUser.role === 'admin' || // Add admin role
          authUser.role === 'faculty' || // Add faculty role
          authUser.role === 'teacher' || // Add teacher role
          (authUser.permissions && authUser.permissions.transport_access) ||
          (typeof authUser.role === 'string' && authUser.role.toLowerCase().includes('driver')) ||
          (typeof authUser.role === 'string' && authUser.role.toLowerCase().includes('transport')) ||
          (typeof authUser.role === 'string' && authUser.role.toLowerCase().includes('admin')) ||
          (typeof authUser.role === 'string' && authUser.role.toLowerCase().includes('faculty'));

        if (!hasDriverRole) {
          console.error('❌ User does not have driver role - showing all details for debugging:', {
            email: authUser.email,
            role: authUser.role,
            roleType: typeof authUser.role,
            isTargetUser: isTargetDriverUser,
            checkedRoles: ['driver', 'transport_staff', 'staff', 'employee', 'transport_employee', 'transport', 'admin', 'faculty', 'teacher'],
            permissions: authUser.permissions,
            fullUserData: JSON.stringify(authUser, null, 2)
          });
          
          oauthDebugService.logStep(9, 'Role Validation', 'failed', {
            userRole: authUser.role,
            isTargetUser: isTargetDriverUser,
            checkedRoles: ['driver', 'transport_staff', 'staff', 'employee', 'transport_employee', 'transport', 'admin', 'faculty', 'teacher'],
            permissions: authUser.permissions
          }, `User role "${authUser.role}" does not have driver privileges`);
          
          oauthDebugService.endSession('failure', `Access denied: User role "${authUser.role}" not authorized for driver access`);
          setError(`Access denied: Only users with driver privileges can access the driver dashboard. Current role: "${authUser.role}". Contact admin if you should have driver access.`);
          return false;
        }

        if (isTargetDriverUser) {
          console.log('✅ Target driver user detected - allowing access:', authUser.email);
        }

        console.log('✅ Driver role validated for OAuth user:', {
          email: authUser.email,
          role: authUser.role
        });

        oauthDebugService.logStep(9, 'Role Validation', 'completed', {
          userRole: authUser.role,
          hasDriverRole: true
        });

        oauthDebugService.logStep(10, 'Session Created', 'in-progress', {
          userType: 'driver',
          userEmail: authUser.email
        });

        // Create driver session for OAuth user
        const driverAuthData = {
          user: {
            id: authUser.id,
            email: authUser.email,
            driver_name: authUser.full_name || 'Driver',
            phone: authUser.phone_number,
            rating: 0,
            role: 'driver' as const
          },
          driver: {
            id: authUser.id,
            name: authUser.full_name,
            email: authUser.email,
            phone: authUser.phone_number,
            rating: 0
          },
          session: {
            access_token: token,
            refresh_token: refreshToken || '',
            expires_at: Date.now() + (24 * 60 * 60 * 1000)
          }
        };

        // Store driver auth data
        driverAuthService.storeAuthData(driverAuthData);
        
        // Update context state with DriverUser type
        setUser(driverAuthData.user);
        setUserType('driver');
        setSession(driverAuthData.session as any); // Cast to compatible session type

        oauthDebugService.logStep(10, 'Session Created', 'completed', {
          userType: 'driver',
          userEmail: authUser.email,
          userId: authUser.id,
          sessionStored: true
        });

        oauthDebugService.logStep(11, 'Redirect Complete', 'completed');
        oauthDebugService.endSession('success', 'Driver OAuth login completed successfully');

        return true;
      }
      if (authUser) {
        // Integrate with database - find or create student record
        try {
          console.log('🔗 Integrating parent app user with database:', authUser.email);
          console.log('🔗 Parent app user object:', authUser);
          const integrationResult = await ParentAppIntegrationService.findOrCreateStudentFromParentApp(authUser);
          
          if (integrationResult && integrationResult.student) {
            const { student, isNewStudent } = integrationResult;
            console.log(`${isNewStudent ? '🆕 Created new' : '✅ Found existing'} student record:`, {
              studentId: student.id,
              email: student.email,
              rollNumber: student.roll_number
            });

            // Update the user object with student information
            const enhancedUser = {
              ...authUser,
              studentId: student.id,
              rollNumber: student.roll_number,
              isNewStudent,
              // Add additional student info
              departmentId: student.department_id,
              programId: student.program_id,
              profileCompletionPercentage: student.profile_completion_percentage
            };

            console.log('🔧 Setting enhanced user in auth context:', {
              id: enhancedUser.id,
              email: enhancedUser.email,
              studentId: enhancedUser.studentId,
              rollNumber: enhancedUser.rollNumber,
              isNewStudent: enhancedUser.isNewStudent
            });
            
            // Store the enhanced user object in the parent auth service
            parentAuthService.updateUser(enhancedUser);
            setUser(enhancedUser);
            
            // Also store in sessionManager format for compatibility
            const session = parentAuthService.getSession();
            if (session) {
              const sessionData = {
                user: {
                  id: enhancedUser.id,
                  email: enhancedUser.email,
                  user_metadata: {
                    student_id: enhancedUser.studentId,
                    student_name: enhancedUser.full_name,
                    roll_number: enhancedUser.rollNumber
                  }
                },
                session: {
                  access_token: parentAuthService.getAccessToken() || '',
                  expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
                  refresh_token: parentAuthService.getRefreshToken() || ''
                }
              };
              sessionManager.setSession(sessionData);
              console.log('✅ Session stored in sessionManager for student:', enhancedUser.studentId);
            }
          } else {
            console.warn('⚠️ Database integration returned no result, using fallback');
            // Create a fallback enhanced user with mock student data
            const fallbackUser = {
              ...authUser,
              studentId: authUser.id, // Use original ID as fallback
              rollNumber: `PA${authUser.id.substring(0, 8).toUpperCase()}`,
              isNewStudent: true,
              profileCompletionPercentage: 60
            };
            console.log('🔧 Setting fallback user in auth context:', {
              id: fallbackUser.id,
              email: fallbackUser.email,
              studentId: fallbackUser.studentId,
              rollNumber: fallbackUser.rollNumber,
              isNewStudent: fallbackUser.isNewStudent
            });
            
            // Store the fallback enhanced user object
            parentAuthService.updateUser(fallbackUser);
            setUser(fallbackUser);
          }
        } catch (dbError) {
          console.warn('⚠️ Database integration failed, creating fallback user:', dbError);
          // Create a fallback enhanced user with mock student data
          const fallbackUser = {
            ...authUser,
            studentId: authUser.id, // Use original ID as fallback
            rollNumber: `PA${authUser.id.substring(0, 8).toUpperCase()}`,
            isNewStudent: true,
            profileCompletionPercentage: 60
          };
          
          console.log('🔧 Setting fallback user in auth context (catch block):', {
            id: fallbackUser.id,
            email: fallbackUser.email,
            studentId: fallbackUser.studentId,
            rollNumber: fallbackUser.rollNumber,
            isNewStudent: fallbackUser.isNewStudent
          });
          
          // Store the fallback enhanced user object
          parentAuthService.updateUser(fallbackUser);
          setUser(fallbackUser);
        }

        const newSession = parentAuthService.getSession();
        setSession(newSession);
        setUserType('passenger'); // Ensure passenger user type is set
        return true;
      }
      return false;
    } catch (err) {
      console.error('Handle auth callback error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    return unifiedAuthService.hasPermission(permission);
  };

  const hasRole = (role: string): boolean => {
    return unifiedAuthService.hasRole(role);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return unifiedAuthService.hasAnyRole(roles);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        error,
        userType,
        login,
        loginDriver,
        loginDriverDirect,
        loginDriverOAuth,
        logout,
        refreshSession,
        validateSession,
        hasPermission,
        hasRole,
        hasAnyRole,
        handleAuthCallback
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Additional hooks for convenience
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

export function useCurrentUser(): UnifiedUser | null {
  const { user } = useAuth();
  return user;
}

export function usePermission(permission: string): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

export function useRole(role: string): boolean {
  const { hasRole } = useAuth();
  return hasRole(role);
}

export function useAnyRole(roles: string[]): boolean {
  const { hasAnyRole } = useAuth();
  return hasAnyRole(roles);
}

export function useAuthLoading(): boolean {
  const { isLoading } = useAuth();
  return isLoading;
}

export function useAuthError(): string | null {
  const { error } = useAuth();
  return error;
}

export function useSession() {
  const { session, validateSession, refreshSession } = useAuth();
  return { session, validateSession, refreshSession };
}
