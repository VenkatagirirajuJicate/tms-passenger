'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  UserCheck,
  Flag,
  RefreshCw,
  ArrowUp,
  XCircle,
  RotateCcw,
  PlusCircle,
  Settings,
  Eye,
  ChevronRight,
  Calendar,
  Timer,
  Zap,
  Star,
  TrendingUp,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ActivityItem {
  id: string;
  type: string;
  actor: {
    type: string;
    name: string;
  };
  description: string;
  details: any;
  isMilestone: boolean;
  timestamp: string;
}

interface ActionTrackerProps {
  grievanceId: string;
  isOpen: boolean;
  onClose: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Helper function to get admin display name
const getAdminDisplayName = (grievance: any) => {
  if (grievance.admin_users) {
    const roleName = grievance.admin_users.role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    return `${grievance.admin_users.name} (${roleName})`;
  }
  return 'Admin Team';
};

const getActionDescription = (activity: any, grievance: any) => {
  switch (activity.activity_type) {
    case 'grievance_created':
      return 'Grievance submitted successfully';
    case 'grievance_assigned':
      return `Assigned to ${getAdminDisplayName(grievance)}`;
    case 'grievance_unassigned':
      return 'Unassigned from admin';
    case 'grievance_reassigned':
      return `Reassigned to ${getAdminDisplayName(grievance)}`;
    case 'grievance_status_changed':
      return `Status updated to ${activity.new_values?.status || 'unknown'}`;
    case 'grievance_priority_changed':
      return `Priority changed to ${activity.new_values?.priority || 'unknown'}`;
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

const GrievanceActionTracker: React.FC<ActionTrackerProps> = ({
  grievanceId,
  isOpen,
  onClose,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showMilestonesOnly, setShowMilestonesOnly] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  useEffect(() => {
    if (isOpen && grievanceId) {
      fetchActivities();
      
      // Set up auto-refresh
      let interval: NodeJS.Timeout;
      if (autoRefresh) {
        interval = setInterval(fetchActivities, refreshInterval);
      }
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [isOpen, grievanceId, autoRefresh, refreshInterval]);

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
        setLastUpdated(new Date());
      } else {
        throw new Error(data.error || 'Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activity timeline');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'grievance_created':
        return PlusCircle;
      case 'grievance_assigned':
      case 'grievance_reassigned':
        return UserCheck;
      case 'grievance_unassigned':
        return User;
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
      case 'admin_action_taken':
        return Settings;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'grievance_created':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'grievance_assigned':
      case 'grievance_reassigned':
        return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'grievance_unassigned':
        return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'grievance_status_changed':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'grievance_priority_changed':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'grievance_commented':
        return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'grievance_resolved':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'grievance_escalated':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'grievance_closed':
        return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'grievance_reopened':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'admin_action_taken':
        return 'text-indigo-600 bg-indigo-100 border-indigo-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getDisplayTitle = (type: string) => {
    switch (type) {
      case 'grievance_created':
        return 'Grievance Submitted';
      case 'grievance_assigned':
        return 'Assigned to Admin Team';
      case 'grievance_reassigned':
        return 'Reassigned to Admin Team';
      case 'grievance_unassigned':
        return 'Unassigned';
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
      case 'admin_action_taken':
        return 'Admin Action';
      default:
        return 'Activity';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getProgressPercentage = () => {
    const milestones = activities.filter(a => a.isMilestone);
    if (milestones.length === 0) return 0;
    
    const resolvedOrClosed = milestones.some(m => 
      m.type === 'grievance_resolved' || m.type === 'grievance_closed'
    );
    
    if (resolvedOrClosed) return 100;
    
    const assigned = milestones.some(m => 
      m.type === 'grievance_assigned' || m.type === 'grievance_reassigned'
    );
    
    if (assigned) return 60;
    
    return 20; // Just created
  };

  const filteredActivities = showMilestonesOnly 
    ? activities.filter(a => a.isMilestone)
    : activities;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Action Tracker</h2>
              <p className="text-sm text-gray-600">
                Track all actions taken on your grievance
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {lastUpdated && (
              <div className="text-xs text-gray-500 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Updated {formatTimestamp(lastUpdated.toISOString())}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">{getProgressPercentage()}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Submitted</span>
            <span>Assigned</span>
            <span>In Progress</span>
            <span>Resolved</span>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowMilestonesOnly(!showMilestonesOnly)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  showMilestonesOnly
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Star className="w-4 h-4 inline mr-1" />
                Milestones Only
              </button>
              <span className="text-sm text-gray-500">
                {filteredActivities.length} of {activities.length} activities
              </span>
            </div>
            <button
              onClick={fetchActivities}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Activities Timeline */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: '500px' }}>
          {loading && activities.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading activities...</span>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No activities found</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {filteredActivities.map((activity, index) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  const colorClasses = getActivityColor(activity.type);
                  const title = getDisplayTitle(activity.type);
                  
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative"
                    >
                      {/* Timeline line */}
                      {index < filteredActivities.length - 1 && (
                        <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
                      )}
                      
                      <div
                        onClick={() => setSelectedActivity(activity)}
                        className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${colorClasses}`}>
                          <ActivityIcon className="w-5 h-5" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-900">{title}</h3>
                                {activity.isMilestone && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <Star className="w-3 h-3 mr-1" />
                                    Milestone
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <User className="w-3 h-3" />
                                  <span>{activity.actor.name}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatTimestamp(activity.timestamp)}</span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Auto-refresh indicator */}
        {autoRefresh && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-center text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Auto-refreshing every {refreshInterval / 1000} seconds</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Activity Detail Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4"
            onClick={() => setSelectedActivity(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {getDisplayTitle(selectedActivity.type)}
                </h3>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <p className="text-gray-900">{selectedActivity.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Performed by
                    </label>
                    <p className="text-gray-900">{selectedActivity.actor.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <p className="text-gray-900">
                      {formatTimestamp(selectedActivity.timestamp)}
                    </p>
                  </div>
                </div>
                
                {selectedActivity.details && Object.keys(selectedActivity.details).length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Details
                    </label>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedActivity.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GrievanceActionTracker; 