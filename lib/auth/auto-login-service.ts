import parentAuthService, { ParentAppUser, AuthSession } from './parent-auth-service';
import { ParentAppIntegrationService } from './parent-app-integration';
import { sessionManager } from '../session';

export interface AutoLoginResult {
  success: boolean;
  user?: ParentAppUser | null;
  session?: AuthSession | null;
  error?: string;
  needsLogin?: boolean;
  enhanced?: boolean;
}

export class AutoLoginService {
  private static instance: AutoLoginService;
  private autoLoginAttempted = false;

  static getInstance(): AutoLoginService {
    if (!AutoLoginService.instance) {
      AutoLoginService.instance = new AutoLoginService();
    }
    return AutoLoginService.instance;
  }

  /**
   * Comprehensive auto-login check and restoration
   */
  async attemptAutoLogin(): Promise<AutoLoginResult> {
    try {
      console.log('🔄 Auto-login: Starting comprehensive authentication check...');
      
      // Check if we already attempted auto-login in this session
      if (this.autoLoginAttempted) {
        console.log('🔄 Auto-login: Already attempted, skipping...');
        return this.getCurrentAuthState();
      }

      this.autoLoginAttempted = true;

      // Step 1: Check for stored authentication data
      const storedUser = parentAuthService.getUser();
      const storedSession = parentAuthService.getSession();
      const accessToken = parentAuthService.getAccessToken();

      console.log('🔄 Auto-login: Stored data check:', {
        hasUser: !!storedUser,
        hasSession: !!storedSession,
        hasToken: !!accessToken,
        userEmail: storedUser?.email,
        studentId: (storedUser as any)?.studentId
      });

      // Step 2: If no stored data, return needs login
      if (!storedUser || !accessToken) {
        console.log('🔄 Auto-login: No stored authentication data, needs login');
        return { success: false, needsLogin: true };
      }

      // Step 3: Validate stored token with parent app
      console.log('🔄 Auto-login: Validating stored token...');
      const isValidToken = await parentAuthService.validateSession();
      
      if (!isValidToken) {
        console.log('🔄 Auto-login: Stored token is invalid, needs fresh login');
        this.clearStoredAuth();
        return { success: false, needsLogin: true };
      }

      console.log('✅ Auto-login: Token validation successful');

      // Step 4: Check if user object needs enhancement (student ID integration)
      let finalUser = storedUser;
      let enhanced = false;

      if (!storedUser.studentId && storedUser.email) {
        console.log('🔧 Auto-login: User needs enhancement, integrating with database...');
        
        try {
          const integrationResult = await ParentAppIntegrationService.findOrCreateStudentFromParentApp(storedUser);
          
          if (integrationResult && integrationResult.student) {
            const { student, isNewStudent } = integrationResult;
            console.log(`${isNewStudent ? '🆕' : '✅'} Auto-login: Student integration successful:`, {
              studentId: student.id,
              email: student.email,
              rollNumber: student.roll_number
            });

            // Create enhanced user object
            finalUser = {
              ...storedUser,
              studentId: student.id,
              rollNumber: student.roll_number,
              isNewStudent,
              departmentId: student.department_id,
              programId: student.program_id,
              profileCompletionPercentage: student.profile_completion_percentage
            };

            // Store enhanced user
            parentAuthService.updateUser(finalUser);
            enhanced = true;

            // Also store in sessionManager format for compatibility
            if (storedSession) {
              const sessionData = {
                user: {
                  id: finalUser.id,
                  email: finalUser.email,
                  user_metadata: {
                    student_id: finalUser.studentId,
                    student_name: finalUser.full_name,
                    roll_number: finalUser.rollNumber
                  }
                },
                session: {
                  access_token: accessToken,
                  expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
                  refresh_token: parentAuthService.getRefreshToken() || ''
                }
              };
              sessionManager.setSession(sessionData);
              console.log('✅ Auto-login: Session stored in sessionManager');
            }
          } else {
            console.warn('⚠️ Auto-login: Database integration failed, using stored user');
          }
        } catch (error) {
          console.warn('⚠️ Auto-login: Enhancement failed, using stored user:', error);
        }
      }

      // Step 5: Return successful auto-login result
      console.log('✅ Auto-login: Complete! User authenticated:', {
        email: finalUser.email,
        studentId: finalUser.studentId,
        enhanced
      });

      return {
        success: true,
        user: finalUser,
        session: storedSession,
        enhanced,
        needsLogin: false
      };

    } catch (error) {
      console.error('❌ Auto-login: Failed with error:', error);
      this.clearStoredAuth();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Auto-login failed',
        needsLogin: true
      };
    }
  }

  /**
   * Get current authentication state without validation
   */
  getCurrentAuthState(): AutoLoginResult {
    const storedUser = parentAuthService.getUser();
    const storedSession = parentAuthService.getSession();
    const accessToken = parentAuthService.getAccessToken();

    if (storedUser && accessToken) {
      return {
        success: true,
        user: storedUser,
        session: storedSession,
        needsLogin: false
      };
    }

    return {
      success: false,
      needsLogin: true
    };
  }

  /**
   * Check if auto-login should be attempted
   */
  shouldAttemptAutoLogin(): boolean {
    // Don't auto-login if we're on login page with explicit parameters
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('force_login') === 'true') {
        return false;
      }
    }

    return !this.autoLoginAttempted;
  }

  /**
   * Reset auto-login state (useful for logout)
   */
  resetAutoLoginState(): void {
    this.autoLoginAttempted = false;
  }

  /**
   * Clear all stored authentication data
   */
  private clearStoredAuth(): void {
    try {
      parentAuthService.clearSession();
      sessionManager.clearSession();
      console.log('🗑️ Auto-login: Cleared stored authentication data');
    } catch (error) {
      console.warn('⚠️ Auto-login: Error clearing stored auth:', error);
    }
  }

  /**
   * Quick check if user appears to be logged in (without validation)
   */
  isLoggedIn(): boolean {
    const user = parentAuthService.getUser();
    const token = parentAuthService.getAccessToken();
    return !!(user && token);
  }
}





