'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, User, Clock, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { sessionManager } from '@/lib/session';
import toast from 'react-hot-toast';

interface CommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  grievance: any;
  studentId: string;
}

interface Message {
  id: string;
  message: string;
  sender_type: 'admin' | 'student';
  sender_id: string;
  sender_admin?: {
    id: string;
    name: string;
    role: string;
  };
  sender_student?: {
    id: string;
    student_name: string;
    roll_number: string;
  };
  communication_type: string;
  read_at?: string;
  created_at: string;
}

export default function GrievanceCommunicationModal({ 
  isOpen, 
  onClose, 
  grievance, 
  studentId 
}: CommunicationModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && grievance) {
      fetchMessages();
    }
  }, [isOpen, grievance]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!grievance) return;
    
    setIsLoading(true);
    try {
      const session = sessionManager.getSession();
      const studentId = sessionManager.getCurrentStudentId();
      
      if (!session?.user?.email || !studentId) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/grievances/${grievance.id}/communications`, {
        headers: {
          'X-User-Email': session.user.email,
          'X-Student-Id': studentId
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      setMessages(data);
      
      // Mark admin messages as read
      const unreadAdminMessages = data.filter(
        (msg: Message) => msg.sender_type === 'admin' && !msg.read_at
      );
      
      for (const msg of unreadAdminMessages) {
        await markAsRead(msg.id);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const session = sessionManager.getSession();
      const studentId = sessionManager.getCurrentStudentId();
      
      if (!session?.user?.email || !studentId) {
        throw new Error('Authentication required');
      }

      await fetch(`/api/grievances/${grievance.id}/communications`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Email': session.user.email,
          'X-Student-Id': studentId
        },
        body: JSON.stringify({ communication_id: messageId })
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !grievance) return;
    
    setIsSending(true);
    try {
      const session = sessionManager.getSession();
      const studentId = sessionManager.getCurrentStudentId();
      
      if (!session?.user?.email || !studentId) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/grievances/${grievance.id}/communications`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Email': session.user.email,
          'X-Student-Id': studentId
        },
        body: JSON.stringify({
          message: newMessage.trim(),
          communication_type: 'comment'
        })
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const newMsg = await response.json();
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = (message: Message) => {
    const isFromStudent = message.sender_type === 'student';
    const sender = isFromStudent ? message.sender_student : message.sender_admin;
    
    return (
      <div
        key={message.id}
        className={`flex ${isFromStudent ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-xs lg:max-w-md ${isFromStudent ? 'order-2' : 'order-1'}`}>
          <div
            className={`px-4 py-3 rounded-lg ${
              isFromStudent
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <p className="text-sm">{message.message}</p>
          </div>
          <div className={`mt-1 text-xs text-gray-500 ${isFromStudent ? 'text-right' : 'text-left'}`}>
            <span className="font-medium">
              {isFromStudent ? 'You' : sender?.name || 'Admin'}
            </span>
            {!isFromStudent && sender?.role && (
              <span className="ml-1 text-gray-400">
                ({sender.role.replace('_', ' ')})
              </span>
            )}
            <span className="ml-2">{formatDate(message.created_at)}</span>
          </div>
        </div>
        
        <div className={`flex-shrink-0 ${isFromStudent ? 'order-1 mr-2' : 'order-2 ml-2'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isFromStudent ? 'bg-blue-500' : 'bg-gray-400'
          }`}>
            {isFromStudent ? (
              <User className="w-4 h-4 text-white" />
            ) : (
              <MessageCircle className="w-4 h-4 text-white" />
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Grievance Communication
              </h2>
              <p className="text-sm text-gray-500">
                {grievance?.subject}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No messages yet</p>
              <p className="text-sm text-gray-400">
                Start a conversation with the support team about your grievance
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
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
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

        {/* Grievance Status */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                grievance?.status === 'resolved' ? 'bg-green-500' :
                grievance?.status === 'in_progress' ? 'bg-yellow-500' :
                'bg-red-500'
              }`} />
              <span className="text-gray-600">
                Status: <span className="font-medium capitalize">
                  {grievance?.status?.replace('_', ' ')}
                </span>
              </span>
            </div>
            
            {grievance?.admin_users && (
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="w-4 h-4" />
                <span>
                  Assigned to: <span className="font-medium">
                    {grievance.admin_users.name}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 