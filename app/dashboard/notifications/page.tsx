'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Search, 
  Filter, 
  Check, 
  Settings, 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle,
  Bus,
  CreditCard,
  Shield,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sessionManager } from '@/lib/session';

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
  secondary_action?: {
    text: string;
    url: string;
  };
  tags?: string[];
  created_at: string;
  read: boolean;
  important?: boolean;
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

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
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
  
  // Student state management
  const [student, setStudent] = useState<any>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Memoized student ID to prevent unnecessary re-renders
  const studentId = useMemo(() => student?.student_id || '', [student?.student_id]);

  // Initialize student data once
  useEffect(() => {
    const initializeStudent = () => {
      try {
        if (!sessionManager.isAuthenticated()) {
          toast.error('Please login to continue');
          window.location.href = '/login';
          return;
        }

        const currentStudent = sessionManager.getCurrentStudent();
        if (!currentStudent) {
          toast.error('Invalid session data');
          window.location.href = '/login';
          return;
        }

        // Set student data once
        setStudent(currentStudent);
      } catch (error) {
        console.error('Error initializing student:', error);
        toast.error('Failed to load user data');
      }
    };

    initializeStudent();
  }, []); // Only run once on mount

  // Fetch initial data when student is loaded
  useEffect(() => {
    if (studentId) {
      fetchNotifications();
      fetchSettings();
    }
  }, [studentId]); // Only when student ID changes

  // Fetch notifications when filters or pagination change
  useEffect(() => {
    if (studentId) {
      fetchNotifications();
    }
  }, [currentPage, selectedCategory, selectedType, showUnreadOnly, studentId]);

  const fetchNotifications = useCallback(async () => {
    if (!studentId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        userId: studentId,
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedType !== 'all' && { type: selectedType }),
        ...(showUnreadOnly && { unreadOnly: 'true' })
      });

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const result = await response.json();
      if (result.success) {
        setNotifications(result.data.notifications || []);
        setTotalPages(Math.ceil((result.data.total || 0) / pageSize));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [studentId, currentPage, pageSize, selectedCategory, selectedType, showUnreadOnly]);

  const fetchSettings = useCallback(async () => {
    if (!studentId) return;
    
    try {
      const response = await fetch(`/api/notifications/settings?userId=${studentId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSettings(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, [studentId]);

  const markAsRead = async (notificationId: string) => {
    if (!studentId) return;
    
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: studentId })
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, read: true }
              : n
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    if (!studentId) return;
    
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: studentId })
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!studentId) return;
    
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: studentId, settings: updatedSettings })
      });
      
      if (response.ok) {
        toast.success('Settings updated successfully');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const handleManualRefresh = async () => {
    if (!studentId) return;
    
    setLoading(true);
    try {
      await Promise.all([fetchNotifications(), fetchSettings()]);
      toast.success('Notifications refreshed');
    } catch (error) {
      toast.error('Failed to refresh notifications');
    } finally {
      setLoading(false);
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

  const filteredNotifications = notifications.filter(notification => {
    if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleActionClick = (action: { text: string; url: string }) => {
    if (action.url.startsWith('http')) {
      window.open(action.url, '_blank');
    } else {
      window.location.href = action.url;
    }
  };

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const clearAllSelections = () => {
    setSelectedNotifications([]);
  };

  // Show loading state while student is being initialized
  if (!student) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 min-w-0">
              {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Stay updated with your transport and payment notifications
              </p>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Mark all read</span>
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
          <div className="bg-white rounded-lg p-1.5 sm:p-2 md:p-3 lg:p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Bell className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-gray-400 mr-1 sm:mr-1.5 md:mr-2 lg:mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-900 truncate">Total</p>
                <p className="text-xs sm:text-sm md:text-lg lg:text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-1.5 sm:p-2 md:p-3 lg:p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 bg-blue-500 rounded-full mr-1 sm:mr-1.5 md:mr-2 lg:mr-3 flex-shrink-0"></div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-900 truncate">Unread</p>
                <p className="text-xs sm:text-sm md:text-lg lg:text-2xl font-bold text-blue-600">{unreadCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-1.5 sm:p-2 md:p-3 lg:p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Bus className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-blue-400 mr-1 sm:mr-1.5 md:mr-2 lg:mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-900 truncate">Transport</p>
                <p className="text-xs sm:text-sm md:text-lg lg:text-2xl font-bold text-gray-900">
                  {notifications.filter(n => n.category === 'transport').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-1.5 sm:p-2 md:p-3 lg:p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <CreditCard className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-green-400 mr-1 sm:mr-1.5 md:mr-2 lg:mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-900 truncate">Payment</p>
                <p className="text-xs sm:text-sm md:text-lg lg:text-2xl font-bold text-gray-900">
                  {notifications.filter(n => n.category === 'payment').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General Settings */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">General</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-700">Push notifications</label>
                  <button
                    onClick={() => updateSettings({ pushEnabled: !settings.pushEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.pushEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.pushEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
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
              </div>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Categories</h4>
              <div className="space-y-3">
                {Object.entries(settings.categories).map(([category, enabled]) => (
                  <div key={category} className="flex items-center justify-between">
                    <label className="text-sm text-gray-700 capitalize">{category}</label>
                    <button
                      onClick={() => updateSettings({
                        categories: { ...settings.categories, [category]: !enabled }
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 sm:mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-col space-y-3 sm:space-y-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Categories</option>
              <option value="transport">Transport</option>
              <option value="payment">Payment</option>
              <option value="system">System</option>
              <option value="emergency">Emergency</option>
            </select>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Types</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="success">Success</option>
            </select>
            
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                showUnreadOnly 
                  ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 inline" />
              Unread only
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-500">
              {searchQuery || selectedCategory !== 'all' || selectedType !== 'all' || showUnreadOnly
                ? 'Try adjusting your filters'
                : 'You\'re all caught up!'}
            </p>
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
                  className={`p-3 sm:p-4 lg:p-6 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-2 sm:space-x-3 lg:space-x-4">
                    <div className="flex-shrink-0">
                      <TypeIcon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${
                        notification.type === 'error' ? 'text-red-500' :
                        notification.type === 'warning' ? 'text-yellow-500' :
                        notification.type === 'success' ? 'text-green-500' :
                        'text-blue-500'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                        <h4 className={`text-sm font-medium truncate ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                          <CategoryIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-500 truncate">
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <p className={`text-sm mt-1 break-words ${
                        !notification.read ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 sm:mt-3 space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap">
                          <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getTypeColor(notification.type)}`}>
                            {notification.type}
                          </span>
                          <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${getCategoryColor(notification.category)}`}>
                            {notification.category}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          {notification.actionable && notification.primary_action && (
                            <button
                              onClick={() => handleActionClick(notification.primary_action!)}
                              className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <span className="truncate">{notification.primary_action.text}</span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </button>
                          )}
                          
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          )}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="text-sm text-gray-700 text-center sm:text-left">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, notifications.length)} of {notifications.length} notifications
          </div>
          <div className="flex items-center justify-center sm:justify-end space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage; 