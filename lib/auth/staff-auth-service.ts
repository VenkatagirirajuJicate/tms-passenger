import { staffHelpers, StaffMember } from '../staff-helpers';

export interface StaffAuthData {
  isStaff: boolean;
  staffMember: StaffMember | null;
  role: 'staff' | 'passenger' | null;
}

class StaffAuthService {
  private staffStatusCache = new Map<string, { data: StaffAuthData; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if a user is a staff member by querying the staff API
   */
  async checkStaffStatus(email: string): Promise<StaffAuthData> {
    // Check cache first
    const cached = this.staffStatusCache.get(email);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('📋 Using cached staff status for:', email);
      return cached.data;
    }
    try {
      console.log('🔍 Checking staff status for:', email);
      
      // Query the staff API to check if this user exists as staff
      const staffMember = await staffHelpers.getStaffByEmail(email);
      
      let result: StaffAuthData;
      
      if (staffMember) {
        console.log('✅ User found in staff database:', {
          email: staffMember.email,
          fullName: staffMember.full_name,
          designation: staffMember.designation,
          department: staffMember.department
        });
        
        result = {
          isStaff: true,
          staffMember,
          role: 'staff'
        };
      } else {
        console.log('ℹ️ User not found in staff database, treating as passenger');
        result = {
          isStaff: false,
          staffMember: null,
          role: 'passenger'
        };
      }
      
      // Cache the result
      this.staffStatusCache.set(email, { data: result, timestamp: Date.now() });
      return result;
      
    } catch (error) {
      console.error('❌ Error checking staff status:', error);
      
      // If there's an error checking staff status, default to passenger
      // This ensures the login flow doesn't break
      const errorResult = {
        isStaff: false,
        staffMember: null,
        role: 'passenger' as const
      };
      
      // Cache the error result for a shorter duration to prevent repeated failed calls
      this.staffStatusCache.set(email, { data: errorResult, timestamp: Date.now() });
      return errorResult;
    }
  }

  /**
   * Enhance a user object with staff data if they are a staff member
   */
  async enhanceUserWithStaffData(user: any): Promise<any> {
    try {
      const staffData = await this.checkStaffStatus(user.email);
      
      if (staffData.isStaff && staffData.staffMember) {
        const staffMember = staffData.staffMember;
        
        // Enhance the user object with staff-specific data
        const enhancedUser = {
          ...user,
          role: 'staff',
          staff_id: staffMember.staff_id,
          designation: staffMember.designation,
          department: staffMember.department,
          category: staffMember.category,
          institution: staffMember.institution,
          is_active: staffMember.is_active,
          date_of_joining: staffMember.date_of_joining,
          phone: staffMember.phone,
          address: staffMember.address,
          state: staffMember.state,
          district: staffMember.district,
          pincode: staffMember.pincode,
          blood_group: staffMember.blood_group,
          gender: staffMember.gender,
          marital_status: staffMember.marital_status,
          date_of_birth: staffMember.date_of_birth,
          // Add staff-specific permissions
          permissions: {
            ...user.permissions,
            'staff.dashboard': true,
            'students.manage': true,
            'routes.manage': true,
            'bookings.manage': true,
            'reports.view': true,
            'admin.access': true,
            'staff.directory': true,
            'departments.manage': true
          }
        };
        
        console.log('✅ User enhanced with staff data:', {
          email: enhancedUser.email,
          role: enhancedUser.role,
          staffId: enhancedUser.staff_id,
          designation: enhancedUser.designation
        });
        
        return enhancedUser;
      }
      
      // If not staff, return user as-is
      return user;
      
    } catch (error) {
      console.error('❌ Error enhancing user with staff data:', error);
      return user; // Return user as-is if enhancement fails
    }
  }

  /**
   * Get staff member details by email
   */
  async getStaffMember(email: string): Promise<StaffMember | null> {
    try {
      return await staffHelpers.getStaffByEmail(email);
    } catch (error) {
      console.error('❌ Error getting staff member:', error);
      return null;
    }
  }

  /**
   * Validate if a staff member has access to specific features
   */
  hasStaffPermission(user: any, permission: string): boolean {
    if (!user || user.role !== 'staff') {
      return false;
    }
    
    return user.permissions?.[permission] === true;
  }

  /**
   * Check if user can access staff dashboard
   */
  canAccessStaffDashboard(user: any): boolean {
    return this.hasStaffPermission(user, 'staff.dashboard');
  }

  /**
   * Check if user can manage students
   */
  canManageStudents(user: any): boolean {
    return this.hasStaffPermission(user, 'students.manage');
  }

  /**
   * Check if user can manage routes
   */
  canManageRoutes(user: any): boolean {
    return this.hasStaffPermission(user, 'routes.manage');
  }

  /**
   * Check if user can view reports
   */
  canViewReports(user: any): boolean {
    return this.hasStaffPermission(user, 'reports.view');
  }
}

// Export singleton instance
export const staffAuthService = new StaffAuthService();

