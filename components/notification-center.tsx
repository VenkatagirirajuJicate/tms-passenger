'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  Check, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  Filter,
  Search,
  Bus,
  CreditCard,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'transport' | 'payment' | 'system' | 'emergency';
  target_audience: 'all' | 'students' | 'drivers' | 'admins';
  specific_users?: string[];
  is_active: boolean;
  scheduled_at?: string;
  expires_at?: string;
  enable_push_notification: boolean;
  enable_email_notification: boolean;
  enable_sms_notification: boolean;
  actionable: boolean;
  primary_action?: {
    text: string;
    url: string;
    type?: string;
  };
  secondary_action?: {
    text: string;
    url: string;
    type?: string;
  };
  tags?: string[];
  read_by?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
  read: boolean;
}

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  categories: {
    transport: boolean;
    payment: boolean;
    system: boolean;
    emergency: boolean;
  };
  types: {
    info: boolean;
    warning: boolean;
    error: boolean;
    success: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface NotificationCenterProps {
  userId: string;
  userType?: 'student' | 'admin';
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  userId, 
  userType = 'student', 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    emailEnabled: false,
    smsEnabled: false,
    categories: {
      transport: true,
      payment: true,
      system: true,
      emergency: true
    },
    types: {
      info: true,
      warning: true,
      error: true,
      success: true
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '07:00'
    },
    soundEnabled: true,
    vibrationEnabled: true
  });
  
  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Use refs to track ongoing requests to prevent duplicates
  const fetchingNotifications = useRef(false);
  const fetchingSettings = useRef(false);
  const lastFetchTime = useRef<number>(0);
  const FETCH_DEBOUNCE_TIME = 1000; // 1 second debounce

  const fetchNotifications = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (fetchingNotifications.current) {
      return;
    }

    // Debounce requests to prevent rapid successive calls
    const now = Date.now();
    if (now - lastFetchTime.current < FETCH_DEBOUNCE_TIME) {
      return;
    }

    fetchingNotifications.current = true;
    lastFetchTime.current = now;
    setLoading(true);

    try {
      const response = await fetch(
        `/api/notifications?userId=${userId}&limit=20`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const result = await response.json();
      
      if (result.success && result.data.notifications) {
        setNotifications(result.data.notifications);
        setUnreadCount(result.data.notifications.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
      fetchingNotifications.current = false;
    }
  }, [userId]);

  const fetchSettings = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (fetchingSettings.current) {
      return;
    }

    fetchingSettings.current = true;

    try {
      const response = await fetch(`/api/notifications/settings?userId=${userId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSettings(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      fetchingSettings.current = false;
    }
  }, [userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      fetchingNotifications.current = false;
      fetchingSettings.current = false;
    };
  }, []);



  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true }
            : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, settings: updatedSettings })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update notification settings');
      }
      
      toast.success('Notification settings updated');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast.error('Failed to update notification settings');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info': return Info;
      case 'warning': return AlertTriangle;
      case 'error': return AlertCircle;
      case 'success': return CheckCircle;
      default: return Bell;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transport': return Bus;
      case 'payment': return CreditCard;
      case 'system': return Settings;
      case 'emergency': return Shield;
      default: return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'success': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'transport': return 'bg-blue-100 text-blue-800';
      case 'payment': return 'bg-green-100 text-green-800';
      case 'system': return 'bg-purple-100 text-purple-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter notifications based on current filters
  const filteredNotifications = notifications.filter(notification => {
    if (showUnreadOnly && notification.read) return false;
    if (filterCategory !== 'all' && notification.category !== filterCategory) return false;
    if (filterType !== 'all' && notification.type !== filterType) return false;
    if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleActionClick = (action: any) => {
    if (action?.url) {
      window.open(action.url, '_blank');
    }
  };

  const handleBellClick = useCallback(() => {
    if (!isOpen) {
      // Only fetch when opening the panel
      fetchNotifications();
      fetchSettings();
    }
    setIsOpen(!isOpen);
  }, [isOpen, fetchNotifications, fetchSettings]);

  return (
    <div className={`relative ${className}`}>
      {/* Bell Icon */}
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-2 mt-3">
                <button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark all read</span>
                </button>
                <button
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  className={`flex items-center space-x-1 px-3 py-1 text-sm transition-colors ${
                    showUnreadOnly 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span>Unread only</span>
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Notification Settings</h4>
                
                <div className="space-y-3">
                  {/* Sound Settings */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Sound notifications</label>
                    <button
                      onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.soundEnabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {/* Category Settings */}
                  <div>
                    <label className="text-sm text-gray-700 mb-2 block">Categories</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(settings.categories).map(([category, enabled]) => (
                        <label key={category} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => updateSettings({
                              categories: { ...settings.categories, [category]: e.target.checked }
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 capitalize">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="transport">Transport</option>
                  <option value="payment">Payment</option>
                  <option value="system">System</option>
                  <option value="emergency">Emergency</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="success">Success</option>
                </select>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading notifications...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No notifications found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredNotifications.map((notification) => {
                    const TypeIcon = getNotificationIcon(notification.type);
                    const CategoryIcon = getCategoryIcon(notification.category);
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <TypeIcon className={`w-5 h-5 ${
                              notification.type === 'error' ? 'text-red-500' :
                              notification.type === 'warning' ? 'text-yellow-500' :
                              notification.type === 'success' ? 'text-green-500' :
                              'text-blue-500'
                            }`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className={`text-sm font-medium ${
                                !notification.read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <CategoryIcon className="w-4 h-4 text-gray-400" />
                                {!notification.read && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            <p className={`text-sm mt-1 ${
                              !notification.read ? 'text-gray-700' : 'text-gray-500'
                            }`}>
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(notification.type)}`}>
                                  {notification.type}
                                </span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(notification.category)}`}>
                                  {notification.category}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {notification.actionable && notification.primary_action && (
                                  <button
                                    onClick={() => handleActionClick(notification.primary_action)}
                                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                  >
                                    {notification.primary_action.text}
                                  </button>
                                )}
                                <span className="text-xs text-gray-400">
                                  {new Date(notification.created_at).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter; 