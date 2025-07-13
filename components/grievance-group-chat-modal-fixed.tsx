'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, User, Clock, CheckCircle, Users, Shield, UserCheck, Paperclip, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { sessionManager } from '@/lib/session';
import toast from 'react-hot-toast';

interface GroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  grievance: any;
}

interface ChatMessage {
  id: string;
  message: string;
  sender_type: 'admin' | 'student';
  sender_id: string;
  sender_admin?: {
    id: string;
    name: string;
    role: string;
    email: string;
  };
  sender_student?: {
    id: string;
    student_name: string;
    roll_number: string;
    email: string;
  };
  communication_type: string;
  read_at?: string;
  created_at: string;
  attachments?: string[];
}

interface ChatParticipant {
  id: string;
  name: string;
  type: 'student' | 'admin';
  role?: string;
  email: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export default function GrievanceGroupChatModalFixed({ 
  isOpen, 
  onClose, 
  grievance
}: GroupChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && grievance) {
      // Test authentication first
      testAuthentication();
      fetchChatData();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, grievance]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const testAuthentication = async () => {
    try {
      const session = sessionManager.getSession();
      const studentId = sessionManager.getCurrentStudentId();
      
      console.log('🔍 Testing authentication...', {
        hasSession: !!session,
        hasEmail: !!session?.user?.email,
        hasStudentId: !!studentId,
        email: session?.user?.email,
        studentId: studentId
      });

      setDebugInfo({
        hasSession: !!session,
        hasEmail: !!session?.user?.email,
        hasStudentId: !!studentId,
        email: session?.user?.email,
        studentId: studentId,
        isAuthenticated: sessionManager.isAuthenticated()
      });
      
      if (!session?.user?.email || !studentId) {
        setAuthError('Authentication data missing');
        return false;
      }

      // Test API call
      const response = await fetch('/api/test-auth', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': session.user.email,
          'X-Student-Id': studentId,
        },
      });

      const data = await response.json();
      console.log('🔍 API test result:', data);
      
      if (response.ok) {
        setAuthError(null);
        return true;
      } else {
        setAuthError(`API test failed: ${data.error}`);
        return false;
      }
    } catch (error) {
      console.error('🚨 Authentication test error:', error);
      setAuthError(`Authentication test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const fetchChatData = async () => {
    const authOk = await testAuthentication();
    if (!authOk) return;
    
    await Promise.all([
      fetchMessages(),
      fetchParticipants()
    ]);
  };

  const fetchMessages = async () => {
    if (!grievance?.id) return;
    
    setIsLoading(true);
    try {
      const session = sessionManager.getSession();
      const studentId = sessionManager.getCurrentStudentId();
      
      if (!session?.user?.email || !studentId) {
        setAuthError('Authentication required - missing session data');
        setIsLoading(false);
        return;
      }

      console.log('📨 Fetching messages for grievance:', grievance.id);
      console.log('📨 Using headers:', {
        'X-User-Email': session.user.email,
        'X-Student-Id': studentId,
      });

      const response = await fetch(`/api/grievances/${grievance.id}/communications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': session.user.email,
          'X-Student-Id': studentId,
        },
      });

      console.log('📨 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('📨 Response error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch messages');
      }

      const data = await response.json();
      console.log('📨 Messages received:', data);
      setMessages(data || []);
      setAuthError(null);
    } catch (error) {
      console.error('📨 Error fetching messages:', error);
      setAuthError(`Failed to load messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Failed to load messages. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchParticipants = async () => {
    if (!grievance?.id) return;
    
    try {
      const session = sessionManager.getSession();
      const studentId = sessionManager.getCurrentStudentId();
      
      if (!session?.user?.email || !studentId) {
        return;
      }

      const student = sessionManager.getCurrentStudent();
      
      // Mock participants data
      const mockParticipants = [
        {
          id: studentId,
          name: student?.student_name || 'You',
          type: 'student' as const,
          email: session.user.email,
          isOnline: true,
          lastSeen: new Date().toISOString()
        },
        {
          id: grievance.assigned_to || 'admin-1',
          name: 'Transport Admin',
          type: 'admin' as const,
          role: 'Transport Admin',
          email: 'admin@transport.com',
          isOnline: true,
          lastSeen: new Date().toISOString()
        }
      ];
      
      setParticipants(mockParticipants);
    } catch (error) {
      console.error('👥 Error fetching participants:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !grievance?.id) return;
    
    setIsSending(true);
    try {
      const session = sessionManager.getSession();
      const studentId = sessionManager.getCurrentStudentId();
      
      if (!session?.user?.email || !studentId) {
        throw new Error('Authentication required');
      }

      console.log('📤 Sending message:', {
        message: newMessage.trim(),
        grievanceId: grievance.id,
        headers: {
          'X-User-Email': session.user.email,
          'X-Student-Id': studentId
        }
      });

      const response = await fetch(`/api/grievances/${grievance.id}/communications`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Email': session.user.email,
          'X-Student-Id': studentId
        },
        body: JSON.stringify({
          message: newMessage.trim(),
          communication_type: 'group_message'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      const newMsg = await response.json();
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('📤 Error sending message:', error);
      setAuthError(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const getMessageSenderInfo = (message: ChatMessage) => {
    if (message.sender_type === 'student') {
      return {
        name: message.sender_student?.student_name || 'Student',
        role: `Student • ${message.sender_student?.roll_number || ''}`,
        avatar: message.sender_student?.student_name?.charAt(0) || 'S',
        isCurrentUser: message.sender_id === sessionManager.getCurrentStudentId()
      };
    } else {
      return {
        name: message.sender_admin?.name || 'Admin',
        role: message.sender_admin?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Admin',
        avatar: message.sender_admin?.name?.charAt(0) || 'A',
        isCurrentUser: false
      };
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const senderInfo = getMessageSenderInfo(message);
    
    return (
      <div
        key={message.id}
        className={`flex ${senderInfo.isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-xs lg:max-w-md ${senderInfo.isCurrentUser ? 'order-2' : 'order-1'}`}>
          <div
            className={`px-4 py-3 rounded-lg ${
              senderInfo.isCurrentUser
                ? 'bg-blue-600 text-white'
                : message.sender_type === 'admin'
                ? 'bg-green-100 text-gray-900'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <p className="text-sm">{message.message}</p>
          </div>
          <div className={`mt-1 text-xs text-gray-500 ${senderInfo.isCurrentUser ? 'text-right' : 'text-left'}`}>
            <span className="font-medium">
              {senderInfo.isCurrentUser ? 'You' : senderInfo.name}
            </span>
            {!senderInfo.isCurrentUser && (
              <span className="ml-1 text-gray-400">
                ({senderInfo.role})
              </span>
            )}
            <span className="ml-2">{formatDate(message.created_at)}</span>
          </div>
        </div>
        
        <div className={`flex-shrink-0 ${senderInfo.isCurrentUser ? 'order-1 mr-2' : 'order-2 ml-2'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
            senderInfo.isCurrentUser ? 'bg-blue-500' : 
            message.sender_type === 'admin' ? 'bg-green-500' : 'bg-gray-500'
          }`}>
            {senderInfo.avatar}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Group Discussion
              </h2>
              <p className="text-sm text-gray-500">
                {grievance?.subject} • {participants.length} participants
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Show participants"
            >
              <Users className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Debug/Error Section */}
        {authError && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Authentication Error:</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{authError}</p>
            {debugInfo && (
              <details className="mt-2">
                <summary className="text-sm cursor-pointer text-red-600">Debug Info</summary>
                <pre className="text-xs mt-1 bg-red-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : authError ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 mb-4">Unable to load messages</p>
              <button
                onClick={fetchChatData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No messages yet</p>
              <p className="text-sm text-gray-400">
                Start the conversation about this grievance
              </p>
            </div>
          ) : (
            <>
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={authError ? "Fix authentication to send messages" : "Type your message..."}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSending || !!authError}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending || !!authError}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 