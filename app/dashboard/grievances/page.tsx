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
  Activity,
  FileText,
  Users
} from 'lucide-react';
import { studentHelpers } from '@/lib/supabase';
import { sessionManager } from '@/lib/session';
import { Grievance, Route, Student } from '@/types';
import { formatDate, getStatusColor, getStatusText, capitalizeFirst, getErrorMessage } from '@/lib/utils';
import toast from 'react-hot-toast';
import GrievanceGroupChatModal from '@/components/grievance-group-chat-modal-fixed';

export default function GrievancesPage() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showGrievanceModal, setShowGrievanceModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Progress tracker state
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [selectedGrievanceId, setSelectedGrievanceId] = useState<string | null>(null);

  // Group chat states
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [selectedGrievanceForChat, setSelectedGrievanceForChat] = useState<Grievance | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    routeId: '',
    driverName: '',
    category: 'complaint' as Grievance['category'],
    priority: 'medium' as Grievance['priority'],
    subject: '',
    description: ''
  });

  // Add this temporary debug section after the state declarations
  const [debugResult, setDebugResult] = useState<any>(null);
  
  const testAuth = async () => {
    try {
      const session = sessionManager.getSession();
      const studentId = sessionManager.getCurrentStudentId();
      
      console.log('Session:', session);
      console.log('Student ID:', studentId);
      
      setDebugResult({
        hasSession: !!session,
        hasEmail: !!session?.user?.email,
        hasStudentId: !!studentId,
        sessionUser: session?.user,
        studentId: studentId
      });
      
      if (!session?.user?.email || !studentId) {
        toast.error('Authentication data missing');
        return;
      }

      toast.success('Authentication data found!');
      
    } catch (error) {
      console.error('Error:', error);
      setDebugResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

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

      const studentData = {
        id: currentStudent.student_id,
        studentName: currentStudent.student_name,
        rollNumber: currentStudent.roll_number,
        email: sessionManager.getSession()?.user?.email || '',
        mobile: '',
        firstLoginCompleted: true,
        profileCompletionPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Student;
      
      setStudent(studentData);

      await Promise.all([
        fetchGrievances(currentStudent.student_id),
        fetchRoutes()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGrievances = async (studentId: string) => {
    try {
      const grievancesData = await studentHelpers.getGrievances(studentId);
      setGrievances(grievancesData);
    } catch (error) {
      console.error('Error fetching grievances:', error);
      toast.error('Failed to load grievances');
    }
  };

  const fetchRoutes = async () => {
    try {
      const routesData = await studentHelpers.getAvailableRoutes();
      setRoutes(routesData);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const handleSubmitGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!student || !formData.subject.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await studentHelpers.submitGrievance({
        studentId: student.id,
        routeId: formData.routeId || undefined,
        driverName: formData.driverName || undefined,
        category: formData.category,
        priority: formData.priority,
        subject: formData.subject.trim(),
        description: formData.description.trim()
      });

      toast.success('Grievance submitted successfully!');
      setShowGrievanceModal(false);
      resetForm();
      
      await fetchGrievances(student.id);
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
      category: 'complaint',
      priority: 'medium',
      subject: '',
      description: ''
    });
  };

  const handleOpenProgressTracker = (grievanceId: string) => {
    setSelectedGrievanceId(grievanceId);
    setShowProgressTracker(true);
  };

  const handleCloseProgressTracker = () => {
    setShowProgressTracker(false);
    setSelectedGrievanceId(null);
  };

  const handleOpenGroupChat = (grievance: Grievance) => {
    setSelectedGrievanceForChat(grievance);
    setShowGroupChat(true);
  };

  const handleCloseGroupChat = () => {
    setShowGroupChat(false);
    setSelectedGrievanceForChat(null);
  };

  const filteredGrievances = grievances.filter(grievance => {
    const matchesStatus = statusFilter === 'all' || grievance.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || grievance.category === categoryFilter;
    const matchesSearch = searchTerm === '' || 
      grievance.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grievance.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grievance.driverName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const getGrievanceIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'closed':
        return <CheckCircle className="h-5 w-5 text-gray-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Grievances & Feedback</h1>
          <p className="text-gray-600">Submit complaints, suggestions, and track their resolution</p>
        </div>
        <button
          onClick={() => setShowGrievanceModal(true)}
          className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Submit Grievance</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Submitted', value: grievances.length, color: 'blue' },
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

      {/* Debug Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Debug Authentication</h3>
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={testAuth}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Test Authentication
          </button>
          {debugResult && (
            <div className="flex-1 bg-white rounded-lg p-3">
              <pre className="text-sm text-gray-800 overflow-x-auto">
                {JSON.stringify(debugResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search grievances..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter('all');
                setCategoryFilter('all');
                setSearchTerm('');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Grievances List */}
      <div className="space-y-4">
        {filteredGrievances.length > 0 ? (
          filteredGrievances.map((grievance) => (
            <div key={grievance.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getGrievanceIcon(grievance.status)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{grievance.subject}</h3>
                    <p className="text-sm text-gray-500">
                      Grievance #{grievance.id.slice(0, 8)} • Submitted {formatDate(grievance.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(grievance.status)}`}>
                    {getStatusText(grievance.status)}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(grievance.priority)}`}>
                    {capitalizeFirst(grievance.priority)}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {capitalizeFirst(grievance.category.replace('_', ' '))}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-700 leading-relaxed">{grievance.description}</p>
              </div>

              {(grievance.driverName || grievance.routeId) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                  {grievance.driverName && (
                    <div>
                      <p className="text-sm text-gray-500">Driver Name</p>
                      <p className="font-medium text-gray-900">{grievance.driverName}</p>
                    </div>
                  )}
                  {grievance.routeId && (
                    <div>
                      <p className="text-sm text-gray-500">Related Route</p>
                      <p className="font-medium text-gray-900">
                        {routes.find(r => r.id === grievance.routeId)?.routeName || 'Unknown Route'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {grievance.resolution && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-green-900">Resolution</h4>
                    {grievance.resolvedAt && (
                      <span className="text-sm text-green-700">
                        • Resolved on {formatDate(grievance.resolvedAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-green-800">{grievance.resolution}</p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>Created: {formatDate(grievance.createdAt)}</span>
                  <span>Updated: {formatDate(grievance.updatedAt)}</span>
                </div>
                <div className="flex items-center space-x-3">
                  {grievance.assignedTo && (
                    <span className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>
                        {grievance.admin_users ? (
                          <>
                            Assigned to <span className="font-medium text-blue-600">
                              {grievance.admin_users.name}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2">
                              {grievance.admin_users.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </>
                        ) : (
                          'Assigned to admin'
                        )}
                      </span>
                    </span>
                  )}
                  <button
                    onClick={() => handleOpenProgressTracker(grievance.id)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded-md transition-colors"
                  >
                    <Activity className="h-4 w-4" />
                    <span className="text-sm font-medium">Track Progress</span>
                  </button>
                  <button
                    onClick={() => handleOpenGroupChat(grievance)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded-md transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">Chat</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No grievances found</h3>
            <p className="text-gray-500 mb-4">
              {statusFilter !== 'all' || categoryFilter !== 'all' || searchTerm
                ? 'Try adjusting your filters'
                : "You haven't submitted any grievances yet"}
            </p>
            <button
              onClick={() => setShowGrievanceModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Submit Your First Grievance
            </button>
          </div>
        )}
      </div>

      {/* Grievance Modal */}
      {showGrievanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Submit Grievance</h2>
              <button
                onClick={() => {
                  setShowGrievanceModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitGrievance} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Grievance['category'] }))}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="complaint">Complaint</option>
                    <option value="suggestion">Suggestion</option>
                    <option value="compliment">Compliment</option>
                    <option value="technical_issue">Technical Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Grievance['priority'] }))}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Related Route (Optional)
                  </label>
                  <select
                    value={formData.routeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, routeId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a route</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.routeNumber} - {route.routeName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Driver Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.driverName}
                    onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter driver name if applicable"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief summary of your grievance"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  rows={5}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide detailed information about your grievance..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowGrievanceModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Grievance'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simple Progress Tracker Modal */}
      {showProgressTracker && selectedGrievanceId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Progress Tracker</h2>
              <button onClick={handleCloseProgressTracker} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-medium">Grievance Submitted</h3>
                    <p className="text-sm text-gray-500">Your grievance has been received</p>
                  </div>
                </div>
                
                {grievances.find(g => g.id === selectedGrievanceId)?.status !== 'open' && (
                  <div className="flex items-center space-x-3">
                    <Clock className="w-6 h-6 text-orange-600" />
                    <div>
                      <h3 className="font-medium">Under Review</h3>
                      <p className="text-sm text-gray-500">Admin is reviewing your grievance</p>
                    </div>
                  </div>
                )}
                
                {grievances.find(g => g.id === selectedGrievanceId)?.status === 'resolved' && (
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <h3 className="font-medium">Resolved</h3>
                      <p className="text-sm text-gray-500">Your grievance has been resolved</p>
                    </div>
                  </div>
                )}
                
                {grievances.find(g => g.id === selectedGrievanceId)?.status === 'closed' && (
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-gray-600" />
                    <div>
                      <h3 className="font-medium">Closed</h3>
                      <p className="text-sm text-gray-500">Your grievance has been closed</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t p-4">
              <button
                onClick={handleCloseProgressTracker}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Chat Modal */}
      {showGroupChat && selectedGrievanceForChat && (
        <GrievanceGroupChatModal
          isOpen={showGroupChat}
          onClose={handleCloseGroupChat}
          grievance={selectedGrievanceForChat}
        />
      )}
    </div>
  );
} 