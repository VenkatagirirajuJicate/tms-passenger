import { supabase } from '@/lib/supabase';

export interface ParentAppUser {
  id: string;
  email: string;
  full_name: string;
  role?: string;
  permissions?: Record<string, boolean>;
}

export interface StudentProfile {
  id: string;
  student_name: string;
  full_name: string;
  email: string;
  roll_number: string;
  mobile: string;
  department_id?: string;
  program_id?: string;
  institution_id?: string;
  auth_source: string;
  first_login_completed: boolean;
  profile_completion_percentage: number;
  transport_enrolled: boolean;
  enrollment_status: string;
  created_at: string;
  updated_at: string;
}

export class ParentAppIntegrationService {
  /**
   * Find or create a student record for a parent app authenticated user
   */
  static async findOrCreateStudentFromParentApp(
    parentAppUser: ParentAppUser
  ): Promise<{ student: StudentProfile; isNewStudent: boolean }> {
    try {
      console.log('🔍 Finding or creating student for parent app user:', parentAppUser.email);

      // First, try to find existing student by email
      const { data: existingStudent, error: findError } = await supabase
        .from('students')
        .select('*')
        .eq('email', parentAppUser.email)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        console.error('❌ Error finding existing student:', findError);
        throw new Error(`Failed to search for existing student: ${findError.message}`);
      }

      if (existingStudent) {
        console.log('✅ Found existing student:', existingStudent.email);
        
        // Update the existing student with parent app info if needed
        const updateData: Partial<StudentProfile> = {
          full_name: parentAppUser.full_name || existingStudent.full_name,
          student_name: parentAppUser.full_name || existingStudent.student_name,
          updated_at: new Date().toISOString()
        };

        // Only update if there are actual changes
        if (updateData.full_name !== existingStudent.full_name || 
            updateData.student_name !== existingStudent.student_name) {
          
          const { data: updatedStudent, error: updateError } = await supabase
            .from('students')
            .update(updateData)
            .eq('id', existingStudent.id)
            .select()
            .single();

          if (updateError) {
            console.warn('⚠️ Could not update existing student (read-only mode?):', updateError);
            // Continue with existing student data if update fails
            return { student: existingStudent, isNewStudent: false };
          }

          return { student: updatedStudent, isNewStudent: false };
        }

        return { student: existingStudent, isNewStudent: false };
      }

      // Student doesn't exist, try to create a new one
      console.log('🆕 Creating new student for parent app user:', parentAppUser.email);

      // Get default institution, department, and program IDs
      const [institutionResult, departmentResult, programResult] = await Promise.all([
        supabase.from('institutions').select('id').limit(1).single(),
        supabase.from('departments').select('id').limit(1).single(),
        supabase.from('programs').select('id').limit(1).single()
      ]);

      const newStudentData: Omit<StudentProfile, 'id' | 'created_at' | 'updated_at'> = {
        student_name: parentAppUser.full_name || parentAppUser.email.split('@')[0],
        full_name: parentAppUser.full_name || parentAppUser.email.split('@')[0],
        email: parentAppUser.email,
        roll_number: `PA${parentAppUser.id.substring(0, 8).toUpperCase()}`, // Parent App prefix
        mobile: '9876543210', // Default mobile, should be updated by user
        department_id: departmentResult.data?.id || null,
        program_id: programResult.data?.id || null,
        institution_id: institutionResult.data?.id || null,
        auth_source: 'external_api', // Use existing enum value since we can't add 'parent_app'
        first_login_completed: true, // Parent app users are considered to have completed first login
        profile_completion_percentage: 60, // Basic profile completion
        transport_enrolled: false, // Not enrolled initially
        enrollment_status: 'pending'
      };

      const { data: newStudent, error: createError } = await supabase
        .from('students')
        .insert([newStudentData])
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create new student (database may be read-only):', createError);
        
        // If we can't create in the database, return a mock student object
        // This allows the app to function even with a read-only database
        const mockStudent: StudentProfile = {
          id: parentAppUser.id,
          ...newStudentData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('🔄 Using mock student data due to read-only database:', mockStudent.email);
        return { student: mockStudent, isNewStudent: true };
      }

      console.log('✅ Successfully created new student:', newStudent.email);
      return { student: newStudent, isNewStudent: true };

    } catch (error) {
      console.error('❌ Error in findOrCreateStudentFromParentApp:', error);
      
      // Return a mock student as fallback to keep the app functional
      const mockStudent: StudentProfile = {
        id: parentAppUser.id,
        student_name: parentAppUser.full_name || parentAppUser.email.split('@')[0],
        full_name: parentAppUser.full_name || parentAppUser.email.split('@')[0],
        email: parentAppUser.email,
        roll_number: `PA${parentAppUser.id.substring(0, 8).toUpperCase()}`,
        mobile: '9876543210',
        department_id: null,
        program_id: null,
        institution_id: null,
        auth_source: 'external_api',
        first_login_completed: true,
        profile_completion_percentage: 60,
        transport_enrolled: false,
        enrollment_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('🔄 Using fallback mock student due to error:', mockStudent.email);
      return { student: mockStudent, isNewStudent: true };
    }
  }

  /**
   * Get student profile by parent app user ID or email
   */
  static async getStudentByParentAppUser(
    parentAppUser: ParentAppUser
  ): Promise<StudentProfile | null> {
    try {
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('email', parentAppUser.email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Student not found
          return null;
        }
        console.error('Error fetching student by parent app user:', error);
        return null;
      }

      return student;
    } catch (error) {
      console.error('Error in getStudentByParentAppUser:', error);
      return null;
    }
  }

  /**
   * Update student profile with parent app user information
   */
  static async updateStudentFromParentApp(
    studentId: string,
    parentAppUser: ParentAppUser
  ): Promise<StudentProfile | null> {
    try {
      const updateData = {
        full_name: parentAppUser.full_name,
        student_name: parentAppUser.full_name,
        updated_at: new Date().toISOString()
      };

      const { data: updatedStudent, error } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', studentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating student from parent app:', error);
        return null;
      }

      return updatedStudent;
    } catch (error) {
      console.error('Error in updateStudentFromParentApp:', error);
      return null;
    }
  }

  /**
   * Convert parent app user to student format for compatibility
   */
  static convertParentAppUserToStudent(parentAppUser: ParentAppUser): StudentProfile {
    return {
      id: parentAppUser.id,
      student_name: parentAppUser.full_name || parentAppUser.email.split('@')[0],
      full_name: parentAppUser.full_name || parentAppUser.email.split('@')[0],
      email: parentAppUser.email,
      roll_number: `PA${parentAppUser.id.substring(0, 8).toUpperCase()}`,
      mobile: '9876543210', // Default mobile
      department_id: null,
      program_id: null,
      institution_id: null,
      auth_source: 'external_api', // Use existing enum value
      first_login_completed: true,
      profile_completion_percentage: 60,
      transport_enrolled: false,
      enrollment_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}





