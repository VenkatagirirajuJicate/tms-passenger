import { createClient } from '@supabase/supabase-js';

export interface StudentAuthData {
  isStudent: boolean;
  studentMember: any | null;
  role: 'student' | 'unknown' | null;
}

class StudentAuthService {
  private studentStatusCache = new Map<string, { data: StudentAuthData; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if a user is a student by querying the external students API
   */
  async checkStudentStatus(email: string): Promise<StudentAuthData> {
    // Check cache first
    const cached = this.studentStatusCache.get(email);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('📋 Using cached student status for:', email);
      return cached.data;
    }

    try {
      console.log('🔍 Checking student status for:', email);
      
      // Query the external students API to check if this user exists as a student
      const apiKey = 'jk_5483dc7eb7f1b7cd730a274ec61765cc_mcka9lzk';
      
      const response = await fetch('https://my.jkkn.ac.in/api/api-management/students', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        console.error('❌ External students API error:', response.status);
        throw new Error(`External students API error: ${response.status}`);
      }

      const data = await response.json();
      const students = data.data || data.students || [];
      
      // Find student by email
      const foundStudent = students.find((student: any) => {
        const emailMatch = student.student_email?.toLowerCase() === email.toLowerCase() ||
                           student.college_email?.toLowerCase() === email.toLowerCase();
        return emailMatch;
      });

      let result: StudentAuthData;
      
      if (foundStudent) {
        console.log('✅ User found in students database:', {
          email: foundStudent.student_email || foundStudent.college_email,
          fullName: `${foundStudent.first_name} ${foundStudent.last_name}`.trim(),
          rollNumber: foundStudent.roll_number
        });
        
        result = {
          isStudent: true,
          studentMember: foundStudent,
          role: 'student'
        };
      } else {
        console.log('ℹ️ User not found in students database');
        result = {
          isStudent: false,
          studentMember: null,
          role: 'unknown'
        };
      }
      
      // Cache the result
      this.studentStatusCache.set(email, { data: result, timestamp: Date.now() });
      return result;
      
    } catch (error) {
      console.error('❌ Error checking student status:', error);
      
      // If there's an error checking student status, default to unknown
      const errorResult = {
        isStudent: false,
        studentMember: null,
        role: 'unknown' as const
      };
      
      // Cache the error result for a shorter duration to prevent repeated failed calls
      this.studentStatusCache.set(email, { data: errorResult, timestamp: Date.now() });
      return errorResult;
    }
  }

  /**
   * Enhance a user object with student data if they are a student
   */
  async enhanceUserWithStudentData(user: any): Promise<any> {
    try {
      const studentData = await this.checkStudentStatus(user.email);
      
      if (studentData.isStudent && studentData.studentMember) {
        const studentMember = studentData.studentMember;
        
        // Enhance the user object with student-specific data
        const enhancedUser = {
          ...user,
          role: 'student',
          student_id: studentMember.id,
          roll_number: studentMember.roll_number,
          department: studentMember.department?.department_name || 'Unknown Department',
          institution: studentMember.institution?.name || 'Unknown Institution',
          program: studentMember.program?.program_name || '',
          degree: studentMember.degree?.degree_name || '',
          father_name: studentMember.father_name,
          mother_name: studentMember.mother_name,
          parent_mobile: studentMember.father_mobile || studentMember.mother_mobile,
          date_of_birth: studentMember.date_of_birth,
          gender: studentMember.gender,
          // Add student-specific permissions
          permissions: {
            ...user.permissions,
            'transport.view': true,
            'transport.book': true,
            'payments.view': true,
            'payments.make': true,
            'grievances.create': true,
            'grievances.view': true,
            'notifications.view': true,
            'profile.view': true,
            'profile.edit': true
          }
        };
        
        console.log('✅ User enhanced with student data:', {
          email: enhancedUser.email,
          role: enhancedUser.role,
          studentId: enhancedUser.student_id,
          rollNumber: enhancedUser.roll_number
        });
        
        return enhancedUser;
      }
      
      // If not student, return user as-is
      return user;
      
    } catch (error) {
      console.error('❌ Error enhancing user with student data:', error);
      return user; // Return user as-is if enhancement fails
    }
  }

  /**
   * Get student member details by email
   */
  async getStudentMember(email: string): Promise<any | null> {
    try {
      const studentData = await this.checkStudentStatus(email);
      return studentData.studentMember;
    } catch (error) {
      console.error('❌ Error getting student member:', error);
      return null;
    }
  }

  /**
   * Clear cache for a specific email
   */
  clearCache(email: string): void {
    this.studentStatusCache.delete(email);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.studentStatusCache.clear();
  }
}

// Export singleton instance
export const studentAuthService = new StudentAuthService();
export default studentAuthService;
