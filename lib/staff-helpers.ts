export interface StaffMember {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  staff_id: string;
  designation: string;
  department: string;
  category: string;
  institution: string;
  is_active: boolean;
  date_of_joining: string;
  profile_picture: string;
  address: string;
  state: string;
  district: string;
  pincode: string;
  blood_group: string;
  gender: string;
  marital_status: string;
  date_of_birth: string;
  created_at: string;
  updated_at: string;
}

export interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  teachingStaff: number;
  nonTeachingStaff: number;
  byDepartment: Record<string, number>;
  byCategory: Record<string, number>;
}

class StaffHelpers {
  private cache: {
    staff: StaffMember[] | null;
    stats: StaffStats | null;
    lastFetched: number | null;
  } = {
    staff: null,
    stats: null,
    lastFetched: null
  };

  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(): boolean {
    if (!this.cache.lastFetched) return false;
    return Date.now() - this.cache.lastFetched < this.CACHE_DURATION;
  }

  /**
   * Fetch all staff members from the API
   */
  async getAllStaff(): Promise<StaffMember[]> {
    try {
      // Check cache first
      if (this.isCacheValid() && this.cache.staff) {
        console.log('📋 Using cached staff data');
        return this.cache.staff;
      }

      console.log('🔍 Fetching fresh staff data from API...');
      
      const response = await fetch('/api/staff', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch staff data');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API returned unsuccessful response');
      }

      // Update cache
      this.cache.staff = data.staff;
      this.cache.lastFetched = Date.now();
      
      console.log('✅ Staff data fetched and cached:', {
        total: data.staff.length,
        timestamp: new Date().toLocaleTimeString()
      });

      return data.staff;

    } catch (error) {
      console.error('❌ Error fetching staff data:', error);
      
      // Return cached data if available, even if expired
      if (this.cache.staff) {
        console.log('⚠️ Returning expired cached staff data due to fetch error');
        return this.cache.staff;
      }
      
      throw error;
    }
  }

  /**
   * Get staff statistics
   */
  async getStaffStats(): Promise<StaffStats> {
    try {
      // Check cache first
      if (this.isCacheValid() && this.cache.stats) {
        return this.cache.stats;
      }

      const staff = await this.getAllStaff();
      
      // Calculate statistics
      const stats: StaffStats = {
        totalStaff: staff.length,
        activeStaff: staff.filter(s => s.is_active).length,
        inactiveStaff: staff.filter(s => !s.is_active).length,
        teachingStaff: staff.filter(s => s.category.toLowerCase().includes('teaching')).length,
        nonTeachingStaff: staff.filter(s => !s.category.toLowerCase().includes('teaching')).length,
        byDepartment: {},
        byCategory: {}
      };

      // Count by department
      staff.forEach(s => {
        const dept = s.department;
        stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1;
      });

      // Count by category
      staff.forEach(s => {
        const cat = s.category;
        stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
      });

      // Update cache
      this.cache.stats = stats;
      
      return stats;

    } catch (error) {
      console.error('❌ Error calculating staff stats:', error);
      
      // Return cached stats if available
      if (this.cache.stats) {
        return this.cache.stats;
      }
      
      throw error;
    }
  }

  /**
   * Get staff member by email
   */
  async getStaffByEmail(email: string): Promise<StaffMember | null> {
    try {
      const staff = await this.getAllStaff();
      return staff.find(s => s.email.toLowerCase() === email.toLowerCase()) || null;
    } catch (error) {
      console.error('❌ Error finding staff by email:', error);
      return null;
    }
  }

  /**
   * Get staff member by ID
   */
  async getStaffById(id: string): Promise<StaffMember | null> {
    try {
      const staff = await this.getAllStaff();
      return staff.find(s => s.id === id) || null;
    } catch (error) {
      console.error('❌ Error finding staff by ID:', error);
      return null;
    }
  }

  /**
   * Search staff by name, email, or designation
   */
  async searchStaff(query: string): Promise<StaffMember[]> {
    try {
      const staff = await this.getAllStaff();
      const lowerQuery = query.toLowerCase();
      
      return staff.filter(s => 
        s.full_name.toLowerCase().includes(lowerQuery) ||
        s.email.toLowerCase().includes(lowerQuery) ||
        s.designation.toLowerCase().includes(lowerQuery) ||
        s.department.toLowerCase().includes(lowerQuery) ||
        s.staff_id.includes(query)
      );
    } catch (error) {
      console.error('❌ Error searching staff:', error);
      return [];
    }
  }

  /**
   * Get staff by department
   */
  async getStaffByDepartment(department: string): Promise<StaffMember[]> {
    try {
      const staff = await this.getAllStaff();
      return staff.filter(s => 
        s.department.toLowerCase().includes(department.toLowerCase())
      );
    } catch (error) {
      console.error('❌ Error filtering staff by department:', error);
      return [];
    }
  }

  /**
   * Get staff by category
   */
  async getStaffByCategory(category: string): Promise<StaffMember[]> {
    try {
      const staff = await this.getAllStaff();
      return staff.filter(s => 
        s.category.toLowerCase().includes(category.toLowerCase())
      );
    } catch (error) {
      console.error('❌ Error filtering staff by category:', error);
      return [];
    }
  }

  /**
   * Get active staff only
   */
  async getActiveStaff(): Promise<StaffMember[]> {
    try {
      const staff = await this.getAllStaff();
      return staff.filter(s => s.is_active);
    } catch (error) {
      console.error('❌ Error filtering active staff:', error);
      return [];
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.staff = null;
    this.cache.stats = null;
    this.cache.lastFetched = null;
    console.log('🗑️ Staff cache cleared');
  }

  /**
   * Force refresh data (ignores cache)
   */
  async forceRefresh(): Promise<StaffMember[]> {
    this.clearCache();
    return await this.getAllStaff();
  }
}

// Export singleton instance
export const staffHelpers = new StaffHelpers();

