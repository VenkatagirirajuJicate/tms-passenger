'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  PlusCircle,
  UserCheck,
  RefreshCw,
  Flag,
  MessageCircle,
  CheckCircle,
  ArrowUp,
  XCircle,
  RotateCcw,
  Clock,
  User,
  Loader2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ActivityTimelineProps {
  grievanceId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to get admin display name
const getAdminDisplayName = (adminData: any) => {
  if (adminData && adminData.name) {
    const roleName = adminData.role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    return `${adminData.name} (${roleName})`;
  }
  return 'Admin Team';
};

const getActionDescription = (activity: any) => {
  const details = activity.action_details || {};
  
  switch (activity.activity_type) {
    case 'grievance_created':
      return 'Grievance submitted successfully';
    case 'grievance_assigned':
      return `Assigned to ${getAdminDisplayName(details.admin_info)}`;
    case 'grievance_unassigned':
      return 'Unassigned from admin team';
    case 'grievance_reassigned':
      return `Reassigned to ${getAdminDisplayName(details.admin_info)}`;
    case 'grievance_status_changed':
      return `Status updated from "${details.old_status || 'unknown'}" to "${details.new_status || 'unknown'}"`;
    case 'grievance_priority_changed':
      return `Priority changed from "${details.old_priority || 'unknown'}" to "${details.new_priority || 'unknown'}"`;
    case 'grievance_resolved':
      return 'Grievance marked as resolved';
    case 'grievance_closed':
      return 'Grievance closed';
    case 'comment_added':
      return 'Comment added by admin';
    case 'resolution_rated':
      return 'Resolution rated by student';
    default:
      return activity.action_description || 'Activity updated';
  }
};

const GrievanceActivityTimeline: React.FC<ActivityTimelineProps> = ({
  grievanceId,
  isOpen,
  onClose
}) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && grievanceId) {
      fetchActivities();
    }
  }, [isOpen, grievanceId]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/grievances/${grievanceId}/activities`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      
      const data = await response.json();
      if (data.success) {
        setActivities(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activity timeline');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'grievance_created':
        return PlusCircle;
      case 'grievance_assigned':
        return UserCheck;
      case 'grievance_status_changed':
        return RefreshCw;
      case 'grievance_priority_changed':
        return Flag;
      case 'grievance_commented':
        return MessageCircle;
      case 'grievance_resolved':
        return CheckCircle;
      case 'grievance_escalated':
        return ArrowUp;
      case 'grievance_closed':
        return XCircle;
      case 'grievance_reopened':
        return RotateCcw;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'grievance_created':
        return 'text-blue-600 bg-blue-100';
      case 'grievance_assigned':
        return 'text-purple-600 bg-purple-100';
      case 'grievance_status_changed':
        return 'text-orange-600 bg-orange-100';
      case 'grievance_priority_changed':
        return 'text-yellow-600 bg-yellow-100';
      case 'grievance_commented':
        return 'text-gray-600 bg-gray-100';
      case 'grievance_resolved':
        return 'text-green-600 bg-green-100';
      case 'grievance_escalated':
        return 'text-red-600 bg-red-100';
      case 'grievance_closed':
        return 'text-gray-600 bg-gray-100';
      case 'grievance_reopened':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getDisplayTitle = (type: string) => {
    switch (type) {
      case 'grievance_created':
        return 'Grievance Submitted';
      case 'grievance_assigned':
        return 'Assigned to Admin';
      case 'grievance_status_changed':
        return 'Status Updated';
      case 'grievance_priority_changed':
        return 'Priority Changed';
      case 'grievance_commented':
        return 'Comment Added';
      case 'grievance_resolved':
        return 'Grievance Resolved';
      case 'grievance_escalated':
        return 'Escalated';
      case 'grievance_closed':
        return 'Grievance Closed';
      case 'grievance_reopened':
        return 'Grievance Reopened';
      default:
        return 'Activity';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Activity Timeline</h2>
              <p className="text-sm text-gray-600">Track your grievance progress</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline */}
        <div className="overflow-y-auto max-h-[calc(80vh-120px)] p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading activities...</span>
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-6">
              {activities.map((activity, index) => {
                const IconComponent = getActivityIcon(activity.type);
                const isLast = index === activities.length - 1;
                
                return (
                  <div key={activity.id} className="relative">
                    {/* Timeline line */}
                    {!isLast && (
                      <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200"></div>
                    )}
                    
                    {/* Activity item */}
                    <div className="flex items-start space-x-4">
                      {/* Icon */}
                      <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${getActivityColor(activity.type)} ${
                        activity.isMilestone ? 'ring-4 ring-white shadow-lg' : ''
                      }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-gray-900">
                                {getDisplayTitle(activity.type)}
                                {activity.isMilestone && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Milestone
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {activity.description}
                              </p>
                              
                              {/* Actor info */}
                              <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                                <User className="w-3 h-3" />
                                <span>
                                  {activity.actor.name || 'System'} 
                                  {activity.actor.type === 'admin' && ' (Admin)'}
                                  {activity.actor.type === 'student' && ' (You)'}
                                </span>
                              </div>
                              
                              {/* Additional details */}
                              {activity.details && Object.keys(activity.details).length > 0 && (
                                <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                                  {activity.details.old_status && activity.details.new_status && (
                                    <p>
                                      <span className="font-medium">Status:</span> {activity.details.old_status} → {activity.details.new_status}
                                    </p>
                                  )}
                                  {activity.details.old_priority && activity.details.new_priority && (
                                    <p>
                                      <span className="font-medium">Priority:</span> {activity.details.old_priority} → {activity.details.new_priority}
                                    </p>
                                  )}
                                  {activity.details.assigned_to && (
                                    <p>
                                      <span className="font-medium">
                                        {getAdminDisplayName(activity.details.admin_info)}
                                      </span>
                                    </p>
                                  )}
                                  {activity.details.message_preview && (
                                    <p>
                                      <span className="font-medium">Message:</span> {activity.details.message_preview}
                                      {activity.details.message_preview.length >= 100 && '...'}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Timestamp */}
                            <div className="flex items-center space-x-1 text-xs text-gray-500 ml-4">
                              <Clock className="w-3 h-3" />
                              <span>{formatDate(activity.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Activities Found</h3>
              <p className="text-gray-500">
                Activities will appear here as your grievance is processed.
              </p>
              <button
                onClick={fetchActivities}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Refresh Timeline
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Timeline shows all public activities related to your grievance
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GrievanceActivityTimeline; 