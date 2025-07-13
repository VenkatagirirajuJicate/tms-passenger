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
  setSession(sessionData: StudentSession) {
    localStorage.setItem('student_session', JSON.stringify(sessionData));
  },

  // Get session from localStorage
  getSession(): StudentSession | null {
    try {
      const storedSession = localStorage.getItem('student_session');
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
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const session = this.getSession();
    return !!session?.user?.user_metadata?.student_id;
  },

  // Get current student ID
  getCurrentStudentId(): string | null {
    const session = this.getSession();
    return session?.user?.user_metadata?.student_id || null;
  },

  // Get current student info
  getCurrentStudent() {
    const session = this.getSession();
    return session?.user?.user_metadata || null;
  }
}; 