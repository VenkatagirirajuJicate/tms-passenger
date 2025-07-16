'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Filter,
  Search,
  X,
  Send,
  Star,
  FileText,
  Route as RouteIcon,
  Calendar,
  Tag,
  MessageCircle,
  Eye,
  ThumbsUp,
  AlertTriangle,
  Settings,
  Activity
} from 'lucide-react';
import GrievanceActivityTimeline from '@/components/grievance-activity-timeline';
import GrievanceActionTracker from '@/components/grievance-action-tracker';
import GrievanceGroupChatModal from '@/components/grievance-group-chat-modal-fixed';
import { sessionManager } from '@/lib/session';
import { formatDate, getStatusColor, getStatusText, capitalizeFirst, getErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';

// Enhanced Grievance Card Component
const EnhancedGrievanceCard = ({ grievance, onView, onRate, onComment, onTrackActions }: any) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100';
      case 'in_progress': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'complaint': return AlertTriangle;
      case 'suggestion': return MessageCircle;
      case 'compliment': return ThumbsUp;
      case 'technical_issue': return Settings;
      default: return MessageCircle;
    }
  };

  const CategoryIcon = getCategoryIcon(grievance.category);
  
  const hasUnreadMessages = grievance.grievance_communications?.some(
    (comm: any) => !comm.read_at && comm.sender_type === 'admin'
  );

  return (
    <motion.div
      layout
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <CategoryIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">{grievance.subject}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{grievance.description}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(grievance.status)}`}>
            {capitalizeFirst(grievance.status)}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(grievance.priority)}`}>
            {capitalizeFirst(grievance.priority)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-4">
          <span className="capitalize">{grievance.category.replace('_', ' ')}</span>
          <span>•</span>
          <span>{formatDate(grievance.createdAt)}</span>
          {grievance.assignedTo && (
            <>
              <span>•</span>
              <span className="text-purple-600">Assigned</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onView(grievance)}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </button>
          
          <button
            onClick={() => onTrackActions(grievance)}
            className="flex items-center space-x-1 px-3 py-1 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <Activity className="w-4 h-4" />
            <span>Track Actions</span>
          </button>

          {grievance.status === 'resolved' && !grievance.rating && (
            <button
              onClick={() => onRate(grievance)}
              className="flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Star className="w-4 h-4" />
              <span>Rate</span>
            </button>
          )}
        </div>

        <button
          onClick={() => onComment(grievance)}
          className="flex items-center space-x-1 px-3 py-1 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
        </button>
      </div>
    </motion.div>
  );
};

// Enhanced Submission Form Component
const EnhancedSubmissionForm = ({ isOpen, onClose, onSubmit, routes }: any) => {
  const [formData, setFormData] = useState({
    routeId: '',
    driverName: '',
    vehicleRegistration: '',
    category: 'complaint',
    grievanceType: 'service_complaint',
    priority: 'medium',
    urgency: 'medium',
    subject: '',
    description: '',
    locationDetails: '',
    incidentDate: '',
    incidentTime: '',
    witnessDetails: '',
    tags: []
  });
  
  const [config, setConfig] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/grievances/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/grievances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route_id: formData.routeId || null,
          driver_name: formData.driverName || null,
          vehicle_registration: formData.vehicleRegistration || null,
          category: formData.category,
          grievance_type: formData.grievanceType,
          priority: formData.priority,
          urgency: formData.urgency,
          subject: formData.subject.trim(),
          description: formData.description.trim(),
          location_details: formData.locationDetails || null,
          incident_date: formData.incidentDate || null,
          incident_time: formData.incidentTime || null,
          witness_details: formData.witnessDetails || null,
          tags: formData.tags
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit grievance');
      }

      const result = await response.json();
      toast.success('Grievance submitted successfully!');
      onSubmit(result);
      onClose();
      resetForm();
      
    } catch (error) {
      console.error('Grievance submission error:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      routeId: '',
      driverName: '',
      vehicleRegistration: '',
      category: 'complaint',
      grievanceType: 'service_complaint',
      priority: 'medium',
      urgency: 'medium',
      subject: '',
      description: '',
      locationDetails: '',
      incidentDate: '',
      incidentTime: '',
      witnessDetails: '',
      tags: []
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Submit New Grievance</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value, grievanceType: 'service_complaint' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="complaint">Complaint</option>
                <option value="suggestion">Suggestion</option>
                <option value="compliment">Compliment</option>
                <option value="technical_issue">Technical Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.grievanceType}
                onChange={(e) => setFormData(prev => ({ ...prev, grievanceType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {config?.categories[formData.category]?.types.map((type: any) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                )) || (
                  <option value="service_complaint">Service Complaint</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Subject and Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Brief summary of your grievance"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Please provide detailed information about your grievance"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Transport Related Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Route</label>
              <select
                value={formData.routeId}
                onChange={(e) => setFormData(prev => ({ ...prev, routeId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Route (if applicable)</option>
                {routes.map((route: any) => (
                  <option key={route.id} value={route.id}>
                    {route.route_name} ({route.route_number})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Driver Name</label>
              <input
                type="text"
                value={formData.driverName}
                onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))}
                placeholder="Driver name (if applicable)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Registration</label>
              <input
                type="text"
                value={formData.vehicleRegistration}
                onChange={(e) => setFormData(prev => ({ ...prev, vehicleRegistration: e.target.value }))}
                placeholder="Vehicle registration number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location Details</label>
              <input
                type="text"
                value={formData.locationDetails}
                onChange={(e) => setFormData(prev => ({ ...prev, locationDetails: e.target.value }))}
                placeholder="Where did this occur?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Incident Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Incident Date</label>
              <input
                type="date"
                value={formData.incidentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, incidentDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Incident Time</label>
              <input
                type="time"
                value={formData.incidentTime}
                onChange={(e) => setFormData(prev => ({ ...prev, incidentTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Witness Details</label>
            <textarea
              value={formData.witnessDetails}
              onChange={(e) => setFormData(prev => ({ ...prev, witnessDetails: e.target.value }))}
              placeholder="Any witnesses or additional contacts (optional)"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Grievance</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Enhanced Grievances Page
export default function EnhancedGrievancesPage() {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [selectedGrievance, setSelectedGrievance] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showActivityTimeline, setShowActivityTimeline] = useState(false);
  const [isActionTrackerOpen, setIsActionTrackerOpen] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Check authentication
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

      const studentData = {
        id: currentStudent.student_id,
        studentName: currentStudent.student_name,
        rollNumber: currentStudent.roll_number,
        email: sessionManager.getSession()?.user?.email || ''
      };
      
      setStudent(studentData);

      // Fetch grievances and routes
      const [grievancesResponse, routesResponse] = await Promise.all([
        fetch('/api/grievances'),
        fetch('/api/grievances/config')
      ]);

      if (grievancesResponse.ok) {
        const grievancesData = await grievancesResponse.json();
        setGrievances(grievancesData.data || []);
      }

      if (routesResponse.ok) {
        const configData = await routesResponse.json();
        setRoutes(configData.routes || []);
      }

    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitGrievance = (newGrievance: any) => {
    setGrievances(prev => [newGrievance, ...prev]);
  };

  const handleViewGrievance = (grievance: any) => {
    setSelectedGrievance(grievance);
    setShowDetailsModal(true);
  };

  const handleRateGrievance = (grievance: any) => {
    setSelectedGrievance(grievance);
    setShowRatingModal(true);
  };

  const handleCommentGrievance = (grievance: any) => {
    setSelectedGrievance(grievance);
    setShowCommentModal(true);
  };

  const handleTrackActions = (grievance: any) => {
    setSelectedGrievance(grievance);
    setIsActionTrackerOpen(true);
  };

  // Filter grievances
  const filteredGrievances = grievances.filter(grievance => {
    const matchesStatus = statusFilter === 'all' || grievance.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || grievance.category === categoryFilter;
    const matchesSearch = searchTerm === '' || 
      grievance.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grievance.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grievance.driverName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading grievances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Grievances</h1>
          <p className="text-gray-600 mt-1">Submit complaints, suggestions, and track their resolution</p>
        </div>
        <button
          onClick={() => setShowSubmissionForm(true)}
          className="mt-4 sm:mt-0 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Submit New Grievance</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { 
            label: 'Total Submitted', 
            value: grievances.length, 
            color: 'blue',
            icon: MessageSquare
          },
          { 
            label: 'Open', 
            value: grievances.filter(g => g.status === 'open').length, 
            color: 'red',
            icon: AlertCircle
          },
          { 
            label: 'In Progress', 
            value: grievances.filter(g => g.status === 'in_progress').length, 
            color: 'yellow',
            icon: Clock
          },
          { 
            label: 'Resolved', 
            value: grievances.filter(g => g.status === 'resolved').length, 
            color: 'green',
            icon: CheckCircle
          }
        ].map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}-50`}>
                  <IconComponent className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search grievances..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="complaint">Complaint</option>
              <option value="suggestion">Suggestion</option>
              <option value="compliment">Compliment</option>
              <option value="technical_issue">Technical Issue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grievances Grid */}
      {filteredGrievances.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredGrievances.map((grievance) => (
              <EnhancedGrievanceCard
                key={grievance.id}
                grievance={grievance}
                onView={handleViewGrievance}
                onRate={handleRateGrievance}
                onComment={handleCommentGrievance}
                onTrackActions={handleTrackActions}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No grievances found</h3>
          <p className="text-gray-500 mb-6">
            {statusFilter !== 'all' || categoryFilter !== 'all' || searchTerm
              ? 'Try adjusting your filters'
              : "You haven't submitted any grievances yet"}
          </p>
          <button
            onClick={() => setShowSubmissionForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit Your First Grievance
          </button>
        </div>
      )}

      {/* Enhanced Submission Form */}
      <EnhancedSubmissionForm
        isOpen={showSubmissionForm}
        onClose={() => setShowSubmissionForm(false)}
        onSubmit={handleSubmitGrievance}
        routes={routes}
      />

      {/* Activity Timeline */}
      <GrievanceActivityTimeline
        grievanceId={selectedGrievance?.id || ''}
        isOpen={showActivityTimeline}
        onClose={() => setShowActivityTimeline(false)}
      />

      {/* Action Tracker Modal */}
      <GrievanceActionTracker
        grievanceId={selectedGrievance?.id || ''}
        isOpen={isActionTrackerOpen}
        onClose={() => {
          setIsActionTrackerOpen(false);
          setSelectedGrievance(null);
        }}
        autoRefresh={true}
        refreshInterval={30000}
      />

      {/* Group Chat Modal */}
      <GrievanceGroupChatModal
        isOpen={showCommentModal}
        onClose={() => {
          setShowCommentModal(false);
          setSelectedGrievance(null);
        }}
        grievanceId={selectedGrievance?.id || ''}
        student={student}
      />

      {/* Additional modals for details, rating, and comments would be added here */}
    </div>
  );
} 