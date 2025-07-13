'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  MessageSquare, 
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Search,
  X,
  Send,
  Star,
  FileText,
  Paperclip,
  Filter,
  Eye,
  MessageCircle,
  ThumbsUp,
  AlertTriangle,
  Settings,
  Activity,
  Calendar,
  MapPin,
  Car,
  Route as RouteIcon
} from 'lucide-react';
import { sessionManager } from '@/lib/session';
import { formatDate, getStatusColor, getStatusText, capitalizeFirst, getErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';

interface GrievanceData {
  id: string;
  subject: string;
  description: string;
  category: string;
  grievance_type: string;
  priority: string;
  urgency: string;
  status: string;
  driver_name?: string;
  vehicle_registration?: string;
  location_details?: string;
  incident_date?: string;
  incident_time?: string;
  witness_details?: string;
  tags?: string[];
  resolution?: string;
  satisfaction_rating?: number;
  feedback_on_resolution?: string;
  routes?: any;
  admin_users?: any;
  grievance_communications?: any[];
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

// Enhanced Grievance Card Component
const EnhancedGrievanceCard = ({ grievance, onView, onCommunicate, onRate }: any) => {
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
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
            {getStatusText(grievance.status)}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(grievance.created_at)}
          </span>
        </div>
      </div>

      {/* Enhanced metadata */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="capitalize">{grievance.category.replace('_', ' ')}</span>
            <span className="text-gray-400">•</span>
            <span className="capitalize">{grievance.priority}</span>
            {grievance.urgency && (
              <>
                <span className="text-gray-400">•</span>
                <span className="capitalize text-orange-600">{grievance.urgency}</span>
              </>
            )}
          </div>
        </div>
        
        {(grievance.driver_name || grievance.vehicle_registration || grievance.location_details) && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            {grievance.driver_name && (
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Driver: {grievance.driver_name}</span>
              </div>
            )}
            {grievance.vehicle_registration && (
              <div className="flex items-center space-x-2">
                <Car className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Vehicle: {grievance.vehicle_registration}</span>
              </div>
            )}
            {grievance.location_details && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{grievance.location_details}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resolution section */}
      {grievance.resolution && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Resolution</span>
          </div>
          <p className="text-sm text-green-700">{grievance.resolution}</p>
          {grievance.resolved_at && (
            <p className="text-xs text-green-600 mt-1">
              Resolved on {formatDate(grievance.resolved_at)}
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onView(grievance)}
          className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1"
        >
          <Eye className="w-4 h-4" />
          <span>View Details</span>
        </button>
        
        <button
          onClick={() => onCommunicate(grievance)}
          className={`px-3 py-2 rounded-lg transition-colors relative ${
            hasUnreadMessages 
              ? 'bg-blue-50 text-blue-600 border-blue-200' 
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          {hasUnreadMessages && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          )}
        </button>

        {grievance.status === 'resolved' && !grievance.satisfaction_rating && (
          <button
            onClick={() => onRate(grievance)}
            className="px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Star className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Enhanced Submission Form Component
const EnhancedSubmissionForm = ({ isOpen, onClose, onSubmit, routes, config }: any) => {
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
    tags: [] as string[],
    attachments: [] as any[]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

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
          tags: formData.tags,
          attachments: formData.attachments
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
      tags: [],
      attachments: []
    });
    setTagInput('');
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Submit New Grievance</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  category: e.target.value,
                  grievanceType: 'service_complaint'
                }))}
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
                {config?.categories[formData.category]?.types?.map((type: any) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                )) || (
                  <option value="service_complaint">Service Complaint</option>
                )}
              </select>
            </div>
          </div>

          {/* Priority and Urgency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Subject */}
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

          {/* Description */}
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

          {/* Transport Details */}
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
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Incident Date and Time */}
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

          {/* Witness Details */}
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

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tags..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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

export default function EnhancedGrievancesPageV2() {
  const [grievances, setGrievances] = useState<GrievanceData[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showGrievanceModal, setShowGrievanceModal] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState<GrievanceData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all',
    search: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
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

      setStudent(currentStudent);

      await Promise.all([
        fetchGrievances(),
        fetchRoutes(),
        fetchConfig()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGrievances = async () => {
    try {
      const response = await fetch('/api/grievances');
      if (!response.ok) throw new Error('Failed to fetch grievances');
      const data = await response.json();
      setGrievances(data.data);
    } catch (error) {
      console.error('Error fetching grievances:', error);
      toast.error('Failed to load grievances');
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await fetch('/api/routes');
      if (response.ok) {
        const data = await response.json();
        setRoutes(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

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

  const handleSubmitGrievance = async (newGrievance: GrievanceData) => {
    setGrievances(prev => [newGrievance, ...prev]);
  };

  const handleViewGrievance = (grievance: GrievanceData) => {
    setSelectedGrievance(grievance);
    setShowDetailsModal(true);
  };

  const handleCommunicateGrievance = (grievance: GrievanceData) => {
    setSelectedGrievance(grievance);
    setShowCommunicationModal(true);
  };

  const handleRateGrievance = (grievance: GrievanceData) => {
    setSelectedGrievance(grievance);
    setShowRatingModal(true);
  };

  const filteredGrievances = grievances.filter(grievance => {
    const matchesStatus = filters.status === 'all' || grievance.status === filters.status;
    const matchesCategory = filters.category === 'all' || grievance.category === filters.category;
    const matchesPriority = filters.priority === 'all' || grievance.priority === filters.priority;
    const matchesSearch = filters.search === '' || 
      grievance.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
      grievance.description.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesPriority && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 h-32 bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Grievances</h1>
          <p className="text-gray-600">Submit complaints, track progress, and communicate with support</p>
        </div>
        <button
          onClick={() => setShowGrievanceModal(true)}
          className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Grievance</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total', value: grievances.length, color: 'blue' },
          { label: 'Open', value: grievances.filter(g => g.status === 'open').length, color: 'orange' },
          { label: 'In Progress', value: grievances.filter(g => g.status === 'in_progress').length, color: 'yellow' },
          { label: 'Resolved', value: grievances.filter(g => g.status === 'resolved').length, color: 'green' }
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full bg-${stat.color}-50`}>
                <MessageSquare className={`h-6 w-6 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="complaint">Complaint</option>
              <option value="suggestion">Suggestion</option>
              <option value="compliment">Compliment</option>
              <option value="technical_issue">Technical Issue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search grievances..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grievances List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredGrievances.length > 0 ? (
          filteredGrievances.map((grievance) => (
            <EnhancedGrievanceCard
              key={grievance.id}
              grievance={grievance}
              onView={handleViewGrievance}
              onCommunicate={handleCommunicateGrievance}
              onRate={handleRateGrievance}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No grievances found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or submit a new grievance</p>
            <button
              onClick={() => setShowGrievanceModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Submit New Grievance
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <EnhancedSubmissionForm
        isOpen={showGrievanceModal}
        onClose={() => setShowGrievanceModal(false)}
        onSubmit={handleSubmitGrievance}
        routes={routes}
        config={config}
      />

      {/* TODO: Add other modals for details, communication, and rating */}
    </div>
  );
} 