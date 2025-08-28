export interface StudentSession {
  user: {
    id: string;
    email: string;
    user_metadata: {
      student_id: string;
      student_name: string;
      roll_number: string;
    };
  };
  session: {
    access_token: string;
    expires_at: number;
    refresh_token: string;
  };
}

export const sessionManager = {
  // Store session in localStorage
  setSession(sessionData: StudentSession | DriverSession) {
    const key = 'driver_id' in sessionData.user.user_metadata ? 'driver_session' : 'student_session';
    localStorage.setItem(key, JSON.stringify(sessionData));
  },

  // Get session from localStorage
  getSession(): StudentSession | DriverSession | null {
    try {
      const storedStudent = localStorage.getItem('student_session');
      const storedDriver = localStorage.getItem('driver_session');
      const storedSession = storedDriver || storedStudent;
      if (!storedSession) return null;

      const session = JSON.parse(storedSession);
      
      // Check if session is expired
      if (session.session?.expires_at && Date.now() > session.session.expires_at) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error parsing session:', error);
      this.clearSession();
      return null;
    }
  },

  // Clear session from localStorage
  clearSession() {
    localStorage.removeItem('student_session');
    localStorage.removeItem('driver_session');
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const session = this.getSession();
    return !!(session?.user?.user_metadata?.student_id || session?.user?.user_metadata?.driver_id);
  },

  // Get current student ID
  getCurrentStudentId(): string | null {
    const session = this.getSession();
    return session?.user?.user_metadata?.student_id || null;
  },

  // Get current driver ID
  getCurrentDriverId(): string | null {
    const session = this.getSession();
    return session?.user?.user_metadata?.driver_id || null;
  },

  // Get current student info
  getCurrentStudent() {
    const session = this.getSession();
    const metadata = session?.user?.user_metadata;
    if (!metadata) return null;
    
    // Return in the format expected by the routes page
    return {
      student_id: metadata.student_id,
      student_name: metadata.student_name,
      roll_number: metadata.roll_number,
      email: session.user.email,
      id: session.user.id
    };
  },

  // Get current driver info
  getCurrentDriver() {
    const session = this.getSession();
    return session?.user?.user_metadata || null;
  }
}; 

export interface DriverSession {
  user: {
    id: string;
    email: string;
    user_metadata: {
      driver_id: string;
      driver_name: string;
    };
  };
  session: {
    access_token: string;
    expires_at: number;
    refresh_token: string;
  };
}