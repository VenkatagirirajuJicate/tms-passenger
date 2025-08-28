'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  RefreshCw, 
  Play, 
  Download, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  Settings,
  Network,
  Eye,
  ArrowRight
} from 'lucide-react';
import { 
  oauthDebugService, 
  DebugSession, 
  DebugStep, 
  formatStepStatus, 
  getStepColor 
} from '@/lib/auth/oauth-debug-service';

const OAUTH_STEPS = [
  { step: 1, name: 'Session Started', description: 'Debug session initialized' },
  { step: 2, name: 'OAuth Initiated', description: 'Redirect to parent app started' },
  { step: 3, name: 'Parent App Reached', description: 'Successfully reached parent app login' },
  { step: 4, name: 'User Authentication', description: 'User logged in on parent app' },
  { step: 5, name: 'Consent Granted', description: 'User granted app permissions' },
  { step: 6, name: 'Callback Received', description: 'OAuth callback with authorization code' },
  { step: 7, name: 'Token Exchange', description: 'Authorization code exchanged for tokens' },
  { step: 8, name: 'User Data Retrieved', description: 'User profile fetched from parent app' },
  { step: 9, name: 'Role Validation', description: 'User role validated for access' },
  { step: 10, name: 'Session Created', description: 'Local user session established' },
  { step: 11, name: 'Redirect Complete', description: 'User redirected to dashboard' },
  { step: 99, name: 'Session Ended', description: 'Debug session completed' }
];

export default function OAuthDebugPage() {
  const router = useRouter();
  const [currentSession, setCurrentSession] = useState<DebugSession | null>(null);
  const [allSessions, setAllSessions] = useState<DebugSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<DebugSession | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(true);

  useEffect(() => {
    // Load existing sessions
    setAllSessions(oauthDebugService.getAllSessions());

    // Subscribe to real-time updates
    const unsubscribe = oauthDebugService.subscribe((session) => {
      setCurrentSession({ ...session });
      if (isLiveMode) {
        setSelectedSession({ ...session });
      }
    });

    // Set initial current session
    const session = oauthDebugService.getCurrentSession();
    if (session) {
      setCurrentSession(session);
      if (isLiveMode) {
        setSelectedSession(session);
      }
    }

    return unsubscribe;
  }, [isLiveMode]);

  const startNewDriverOAuth = () => {
    const sessionId = oauthDebugService.startSession('driver', 'arthanareswaran22@jkkn.ac.in');
    console.log('🎯 Starting new driver OAuth debug session:', sessionId);
    
    // Navigate to login page to start OAuth
    router.push('/login?debug=true&role=driver');
  };

  const startNewPassengerOAuth = () => {
    const sessionId = oauthDebugService.startSession('passenger');
    console.log('🎯 Starting new passenger OAuth debug session:', sessionId);
    
    // Navigate to login page to start OAuth
    router.push('/login?debug=true&role=passenger');
  };

  const exportSession = () => {
    const sessionData = selectedSession ? 
      JSON.stringify(selectedSession, null, 2) : 
      oauthDebugService.exportSession();
    
    if (sessionData) {
      const blob = new Blob([sessionData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oauth-debug-${selectedSession?.sessionId || 'session'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const clearAllSessions = () => {
    oauthDebugService.clearSessions();
    setAllSessions([]);
    setSelectedSession(null);
    setCurrentSession(null);
  };

  const getStepInfo = (stepNumber: number) => {
    return OAUTH_STEPS.find(s => s.step === stepNumber);
  };

  const displaySession = selectedSession || currentSession;

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Eye className="h-6 w-6 mr-3 text-blue-600" />
                OAuth Real-Time Debugger
              </h1>
              <p className="text-gray-600 mt-1">
                Live monitoring of OAuth authentication flow with step-by-step tracking
              </p>
            </div>
            <div className="flex space-x-3">
              <Link 
                href="/login"
                className="btn-secondary flex items-center"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Debug Controls</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={startNewDriverOAuth}
              className="btn-primary flex items-center"
            >
              <Play className="h-4 w-4 mr-2" />
              Test Driver OAuth
            </button>
            
            <button
              onClick={startNewPassengerOAuth}
              className="btn-secondary flex items-center"
            >
              <Play className="h-4 w-4 mr-2" />
              Test Passenger OAuth
            </button>

            <button
              onClick={() => window.location.reload()}
              className="btn-secondary flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>

            {displaySession && (
              <button
                onClick={exportSession}
                className="btn-secondary flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Session
              </button>
            )}

            <button
              onClick={clearAllSessions}
              className="btn-secondary flex items-center text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </button>
          </div>

          <div className="mt-4 flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isLiveMode}
                onChange={(e) => setIsLiveMode(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Live Mode</span>
            </label>
            {currentSession && (
              <div className="flex items-center text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Active Session: {currentSession.sessionId.split('_')[2]}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Session List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Debug Sessions</h3>
              <p className="text-sm text-gray-600">
                {allSessions.length} total sessions
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {allSessions.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No debug sessions yet</p>
                  <p className="text-xs">Start a test to see data</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {allSessions.map((session, index) => (
                    <button
                      key={session.sessionId}
                      onClick={() => {
                        setSelectedSession(session);
                        setIsLiveMode(false);
                      }}
                      className={`w-full text-left p-3 rounded border transition-colors ${
                        selectedSession?.sessionId === session.sessionId
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm font-medium">
                            {session.userType}
                          </span>
                        </div>
                        <div className="flex items-center">
                          {session.finalResult === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : session.finalResult === 'failure' ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(session.startTime).toLocaleTimeString()}
                      </div>
                      {session.userEmail && (
                        <div className="text-xs text-gray-400 truncate mt-1">
                          {session.userEmail}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Step-by-Step Flow */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  OAuth Flow Progress
                </h3>
                {displaySession && (
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-500">
                      Session: {displaySession.sessionId.split('_')[2]}
                    </span>
                    <span className="text-gray-500">
                      Type: {displaySession.userType}
                    </span>
                    {displaySession.userEmail && (
                      <span className="text-gray-500">
                        User: {displaySession.userEmail}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4">
              {!displaySession ? (
                <div className="text-center py-12">
                  <Network className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Active Debug Session
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Start a debug session to see the OAuth flow in real-time
                  </p>
                  <div className="space-x-3">
                    <button
                      onClick={startNewDriverOAuth}
                      className="btn-primary"
                    >
                      Debug Driver Login
                    </button>
                    <button
                      onClick={startNewPassengerOAuth}
                      className="btn-secondary"
                    >
                      Debug Passenger Login
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {OAUTH_STEPS.map((stepInfo) => {
                    const stepData = displaySession.steps.find(s => s.step === stepInfo.step);
                    const status = stepData?.status || 'pending';
                    
                    return (
                      <div
                        key={stepInfo.step}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          status === 'completed' ? 'bg-green-50 border-green-200' :
                          status === 'failed' ? 'bg-red-50 border-red-200' :
                          status === 'in-progress' ? 'bg-blue-50 border-blue-200' :
                          'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              status === 'completed' ? 'bg-green-100 text-green-700' :
                              status === 'failed' ? 'bg-red-100 text-red-700' :
                              status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {stepInfo.step}
                            </div>
                            <div className="ml-4">
                              <h4 className={`font-medium ${getStepColor(status)}`}>
                                {formatStepStatus({ ...stepInfo, status, timestamp: '' })}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {stepInfo.description}
                              </p>
                            </div>
                          </div>
                          
                          {stepData && (
                            <div className="text-right text-xs text-gray-500">
                              <div>{new Date(stepData.timestamp).toLocaleTimeString()}</div>
                              {stepData.duration && (
                                <div>{stepData.duration}ms</div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {stepData && (stepData.data || stepData.error) && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            {stepData.error && (
                              <div className="mb-2">
                                <div className="flex items-center text-red-600 text-sm font-medium mb-1">
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  Error
                                </div>
                                <div className="text-sm text-red-700 bg-red-100 p-2 rounded">
                                  {stepData.error}
                                </div>
                              </div>
                            )}
                            {stepData.data && (
                              <div>
                                <div className="text-xs font-medium text-gray-500 mb-1">Data:</div>
                                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                                  {JSON.stringify(stepData.data, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




