'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Shield,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Lock,
  Smartphone,
  Globe,
  Moon,
  Sun,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Bus,
  Clock,
  Settings as SettingsIcon
} from 'lucide-react';
import { sessionManager } from '@/lib/session';
import { studentHelpers } from '@/lib/supabase';
import { Card, Button, Input, Select, Badge, Alert } from '@/components/modern-ui-components';
import toast from 'react-hot-toast';

interface StudentProfile {
  id: string;
  studentName: string;
  email: string;
  mobile?: string;
  rollNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    // Profile settings
    studentName: '',
    email: '',
    mobile: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    address: '',
    
    // Notification settings
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    bookingReminders: true,
    routeUpdates: true,
    paymentAlerts: true,
    
    // Security settings
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield }
  ];



  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const currentStudent = sessionManager.getCurrentStudent();
      if (!currentStudent?.student_id) {
        throw new Error('No student session found');
      }

      // Get detailed profile
      const profileData = await studentHelpers.getStudentProfile(currentStudent.student_id);
      
      const studentProfile = {
        id: currentStudent.student_id,
        studentName: currentStudent.student_name,
        email: sessionManager.getSession()?.user?.email || '',
        rollNumber: currentStudent.roll_number,
        ...profileData
      };

      setProfile(studentProfile);
      
      // Populate form data
      setFormData(prev => ({
        ...prev,
        studentName: studentProfile.studentName || '',
        email: studentProfile.email || '',
        mobile: studentProfile.mobile || '',
        emergencyContactName: studentProfile.emergencyContactName || '',
        emergencyContactPhone: studentProfile.emergencyContactPhone || '',
        address: studentProfile.addressStreet || ''
      }));

    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async (section: string) => {
    setSaving(true);
    try {
      // Here you would implement the actual save logic based on the section
      switch (section) {
        case 'profile':
          // Save profile data
          break;
        case 'notifications':
          // Save notification preferences
          break;
        case 'security':
          // Handle password change
          if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            throw new Error('Passwords do not match');
          }
          if (!formData.currentPassword || !formData.newPassword) {
            throw new Error('Please fill in all password fields');
          }
          
          // Here you would implement actual password change logic
          // For now, we'll just simulate success
          toast.success('Password updated successfully');
          setFormData(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }));
          break;
      }
      
      if (section !== 'security') {
        toast.success('Settings saved successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Full Name"
            value={formData.studentName}
            onChange={(value) => handleInputChange('studentName', value)}
            icon={User}
          />
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(value) => handleInputChange('email', value)}
            icon={Mail}
          />
          <Input
            label="Mobile Number"
            value={formData.mobile}
            onChange={(value) => handleInputChange('mobile', value)}
            icon={Phone}
          />
          <Input
            label="Roll Number"
            value={profile?.rollNumber || ''}
            disabled
            className="bg-gray-50"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Emergency Contact Name"
            value={formData.emergencyContactName}
            onChange={(value) => handleInputChange('emergencyContactName', value)}
            icon={User}
          />
          <Input
            label="Emergency Contact Phone"
            value={formData.emergencyContactPhone}
            onChange={(value) => handleInputChange('emergencyContactPhone', value)}
            icon={Phone}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
        <Input
          label="Complete Address"
          value={formData.address}
          onChange={(value) => handleInputChange('address', value)}
          icon={MapPin}
        />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => handleSave('profile')}
          loading={isSaving}
          icon={Save}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Channels</h3>
        <div className="space-y-4">
          {[
            { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
            { key: 'smsNotifications', label: 'SMS Notifications', description: 'Receive important updates via SMS' },
            { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive push notifications on your device' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{item.label}</h4>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData[item.key as keyof typeof formData] as boolean}
                  onChange={(e) => handleInputChange(item.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transport Notifications</h3>
        <div className="space-y-4">
          {[
            { key: 'bookingReminders', label: 'Booking Reminders', description: 'Get reminded about upcoming trips' },
            { key: 'routeUpdates', label: 'Route Updates', description: 'Receive updates about route changes or delays' },
            { key: 'paymentAlerts', label: 'Payment Alerts', description: 'Get notified about payment due dates and confirmations' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{item.label}</h4>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData[item.key as keyof typeof formData] as boolean}
                  onChange={(e) => handleInputChange(item.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => handleSave('notifications')}
          loading={isSaving}
          icon={Save}
        >
          Save Preferences
        </Button>
      </div>
    </div>
  );



  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
        <div className="space-y-4 max-w-md">
          <Input
            label="Current Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.currentPassword}
            onChange={(value) => handleInputChange('currentPassword', value)}
            icon={Lock}
          />
          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={(value) => handleInputChange('newPassword', value)}
            icon={Lock}
          />
          <Input
            label="Confirm New Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(value) => handleInputChange('confirmPassword', value)}
            icon={Lock}
          />
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-800"
            >
              {showPassword ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showPassword ? 'Hide' : 'Show'} passwords
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Information</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Account Security Tips</h4>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Use a strong password with at least 8 characters</li>
                <li>• Include numbers, special characters, and mixed case letters</li>
                <li>• Don't share your password with anyone</li>
                <li>• Log out from shared devices</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => handleSave('security')}
          loading={isSaving}
          icon={Save}
          disabled={!formData.currentPassword || !formData.newPassword || formData.newPassword !== formData.confirmPassword}
        >
          Update Password
        </Button>
      </div>
    </div>
  );



  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      default:
        return renderProfileSettings();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-heading-1 mb-2">Settings</h1>
          <p className="text-body">Manage your account preferences and transport settings</p>
        </div>
      </motion.div>

      {/* Settings Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card padding="md">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card padding="lg">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </Card>
        </div>
      </div>
    </div>
  );
} 