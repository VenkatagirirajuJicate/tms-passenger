'use client';

export interface DebugStep {
  step: number;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  timestamp: string;
  data?: any;
  error?: string;
  duration?: number;
}

export interface DebugSession {
  sessionId: string;
  userEmail?: string;
  userType: 'passenger' | 'driver';
  startTime: string;
  endTime?: string;
  steps: DebugStep[];
  finalResult: 'success' | 'failure' | 'pending';
  errorMessage?: string;
}

class OAuthDebugService {
  private currentSession: DebugSession | null = null;
  private listeners: ((session: DebugSession) => void)[] = [];

  /**
   * Start a new debug session
   */
  startSession(userType: 'passenger' | 'driver', userEmail?: string): string {
    const sessionId = `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentSession = {
      sessionId,
      userEmail,
      userType,
      startTime: new Date().toISOString(),
      steps: [],
      finalResult: 'pending'
    };

    this.logStep(1, 'Session Started', 'completed', {
      sessionId,
      userType,
      userEmail,
      timestamp: this.currentSession.startTime
    });

    console.log('🚀 OAuth Debug Session Started:', {
      sessionId,
      userType,
      userEmail,
      timestamp: this.currentSession.startTime
    });

    this.notifyListeners();
    return sessionId;
  }

  /**
   * Log a step in the OAuth process
   */
  logStep(
    stepNumber: number, 
    stepName: string, 
    status: DebugStep['status'], 
    data?: any, 
    error?: string
  ): void {
    if (!this.currentSession) {
      console.warn('⚠️ No active debug session');
      return;
    }

    const existingStepIndex = this.currentSession.steps.findIndex(s => s.step === stepNumber);
    const timestamp = new Date().toISOString();
    const startTime = existingStepIndex >= 0 ? 
      new Date(this.currentSession.steps[existingStepIndex].timestamp).getTime() :
      new Date(timestamp).getTime();
    const duration = existingStepIndex >= 0 ? Date.now() - startTime : undefined;

    const step: DebugStep = {
      step: stepNumber,
      name: stepName,
      status,
      timestamp,
      data,
      error,
      duration
    };

    if (existingStepIndex >= 0) {
      this.currentSession.steps[existingStepIndex] = step;
    } else {
      this.currentSession.steps.push(step);
    }

    const statusEmoji = {
      'pending': '⏳',
      'in-progress': '🔄',
      'completed': '✅',
      'failed': '❌'
    }[status];

    console.log(`${statusEmoji} OAuth Step ${stepNumber}: ${stepName}`, {
      status,
      timestamp,
      duration: duration ? `${duration}ms` : 'N/A',
      data,
      error
    });

    this.notifyListeners();
  }

  /**
   * End the current session
   */
  endSession(result: 'success' | 'failure', errorMessage?: string): void {
    if (!this.currentSession) {
      console.warn('⚠️ No active debug session to end');
      return;
    }

    this.currentSession.endTime = new Date().toISOString();
    this.currentSession.finalResult = result;
    this.currentSession.errorMessage = errorMessage;

    const totalDuration = new Date(this.currentSession.endTime).getTime() - 
      new Date(this.currentSession.startTime).getTime();

    console.log(`🏁 OAuth Debug Session Ended:`, {
      sessionId: this.currentSession.sessionId,
      result,
      totalDuration: `${totalDuration}ms`,
      stepsCompleted: this.currentSession.steps.filter(s => s.status === 'completed').length,
      totalSteps: this.currentSession.steps.length,
      errorMessage
    });

    this.logStep(99, 'Session Ended', result === 'success' ? 'completed' : 'failed', {
      result,
      totalDuration,
      errorMessage
    });

    this.notifyListeners();

    // Store session in localStorage for analysis
    try {
      const sessions = JSON.parse(localStorage.getItem('oauth_debug_sessions') || '[]');
      sessions.unshift(this.currentSession);
      // Keep only last 10 sessions
      if (sessions.length > 10) sessions.splice(10);
      localStorage.setItem('oauth_debug_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.warn('Failed to store debug session:', error);
    }
  }

  /**
   * Get current session
   */
  getCurrentSession(): DebugSession | null {
    return this.currentSession;
  }

  /**
   * Get all stored sessions
   */
  getAllSessions(): DebugSession[] {
    try {
      return JSON.parse(localStorage.getItem('oauth_debug_sessions') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Subscribe to session updates
   */
  subscribe(callback: (session: DebugSession) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(): void {
    if (this.currentSession) {
      this.listeners.forEach(callback => callback(this.currentSession!));
    }
  }

  /**
   * Clear all stored sessions
   */
  clearSessions(): void {
    localStorage.removeItem('oauth_debug_sessions');
    console.log('🗑️ Cleared all debug sessions');
  }

  /**
   * Export current session for sharing
   */
  exportSession(): string | null {
    if (!this.currentSession) return null;
    return JSON.stringify(this.currentSession, null, 2);
  }
}

// Singleton instance
export const oauthDebugService = new OAuthDebugService();

// Helper function to format step status
export const formatStepStatus = (step: DebugStep): string => {
  const statusEmoji = {
    'pending': '⏳',
    'in-progress': '🔄',
    'completed': '✅',
    'failed': '❌'
  }[step.status];

  return `${statusEmoji} ${step.name}`;
};

// Helper function to get step color for UI
export const getStepColor = (status: DebugStep['status']): string => {
  const colors = {
    'pending': 'text-gray-500',
    'in-progress': 'text-blue-600',
    'completed': 'text-green-600',
    'failed': 'text-red-600'
  };
  return colors[status];
};







