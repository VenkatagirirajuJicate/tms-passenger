'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle,
  ExternalLink
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'transport' | 'payment' | 'system' | 'emergency';
  actionable: boolean;
  primary_action?: {
    text: string;
    url: string;
  };
  expires_at?: string;
  created_at: string;
}

interface NotificationBannerProps {
  userId: string;
  className?: string;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({ userId, className = '' }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
  
  // Use refs to track ongoing requests to prevent duplicates
  const fetchingBanner = useRef(false);
  const lastFetchTime = useRef<number>(0);
  const FETCH_DEBOUNCE_TIME = 5000; // 5 seconds debounce for banner

  const fetchBannerNotifications = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (fetchingBanner.current) {
      return;
    }

    // Debounce requests to prevent rapid successive calls
    const now = Date.now();
    if (now - lastFetchTime.current < FETCH_DEBOUNCE_TIME) {
      return;
    }

    fetchingBanner.current = true;
    lastFetchTime.current = now;

    try {
      // Fetch system and emergency notifications separately
      const [systemResponse, emergencyResponse] = await Promise.all([
        fetch(`/api/notifications?userId=${userId}&limit=3&category=system`),
        fetch(`/api/notifications?userId=${userId}&limit=3&category=emergency`)
      ]);
      
      const notifications: Notification[] = [];
      
      if (systemResponse.ok) {
        const systemResult = await systemResponse.json();
        if (systemResult.success && systemResult.data.notifications) {
          notifications.push(...systemResult.data.notifications);
        }
      }
      
      if (emergencyResponse.ok) {
        const emergencyResult = await emergencyResponse.json();
        if (emergencyResult.success && emergencyResult.data.notifications) {
          notifications.push(...emergencyResult.data.notifications);
        }
      }
      
      // Filter out dismissed notifications and expired ones
      const now = new Date();
      const validNotifications = notifications.filter((notification: Notification) => {
        if (dismissedNotifications.includes(notification.id)) return false;
        if (notification.expires_at && new Date(notification.expires_at) < now) return false;
        return true;
      });
      
      // Sort by creation date and limit to 5
      const sortedNotifications = validNotifications
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      
      setNotifications(sortedNotifications);
    } catch (error) {
      console.error('Error fetching banner notifications:', error);
    } finally {
      fetchingBanner.current = false;
    }
  }, [userId]);

  useEffect(() => {
    // Fetch once on mount only - no polling
    fetchBannerNotifications();
  }, [fetchBannerNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      fetchingBanner.current = false;
    };
  }, []);

  const dismissNotification = (notificationId: string) => {
    setDismissedNotifications(prev => [...prev, notificationId]);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info': return Info;
      case 'warning': return AlertTriangle;
      case 'error': return AlertCircle;
      case 'success': return CheckCircle;
      default: return Info;
    }
  };

  const getNotificationColors = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case 'info': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      case 'success': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const handleActionClick = (action: { text: string; url: string }) => {
    if (action.url.startsWith('http')) {
      window.open(action.url, '_blank');
    } else {
      window.location.href = action.url;
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = getNotificationIcon(notification.type);
          const colors = getNotificationColors(notification.type);
          const iconColor = getNotificationIconColor(notification.type);
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              className={`border-l-4 p-4 mb-4 rounded-lg ${colors}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      {notification.title}
                    </h4>
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <p className="text-sm mt-1 opacity-90">
                    {notification.message}
                  </p>
                  
                  {notification.actionable && notification.primary_action && (
                    <div className="mt-3">
                      <button
                        onClick={() => handleActionClick(notification.primary_action!)}
                        className="inline-flex items-center space-x-1 text-sm font-medium hover:underline transition-colors"
                      >
                        <span>{notification.primary_action.text}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs opacity-75">
                    {new Date(notification.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBanner; 