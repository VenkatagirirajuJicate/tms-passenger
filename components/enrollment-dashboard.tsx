'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bus,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth/auth-context';

interface Route {
  id: string;
  routeName: string;
  routeCode: string;
  startPoint: string;
  endPoint: string;
  distance: string;
  estimatedTime: string;
  fare: number;
  capacity: number;
  availableSeats: number;
  currentPassengers: number;
  isActive: boolean;
  stops?: RouteStop[];
  schedule?: {
    morning: string[];
    evening: string[];
  };
}

interface RouteStop {
  id: string;
  name: string;
  time: string;
  sequence: number;
  isMajor: boolean;
}

interface EnrollmentRequest {
  id: string;
  request_status: string;
  preferred_route_id: string;
  preferred_stop_id: string;
  requested_at: string;
  admin_notes?: string;
  rejection_reason?: string;
}

interface EnrollmentDashboardProps {
  student: {
    id: string;
    student_name: string;
    email: string;
    transport_enrolled: boolean;
    enrollment_status: string;
  };
}

export default function EnrollmentDashboard({ student }: EnrollmentDashboardProps) {
  const { user, session } = useAuth();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);
  const [enrollmentRequest, setEnrollmentRequest] = useState<EnrollmentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);
  const [specialRequirements, setSpecialRequirements] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch available routes
      const routesResponse = await fetch('/api/routes/available');
      if (routesResponse.ok) {
        const routesData = await routesResponse.json();
        setRoutes(routesData.routes || []);
      }

      // Check if student has existing enrollment request - prioritize JWT sub field
      const studentId = (user as any)?.sub || 
                       (user as any)?.studentId || 
                       student.id;
      // Get the access token to include in the request
      const accessToken = localStorage.getItem('tms_access_token') || 
                         document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
        console.log('🔑 Including access token in enrollment dashboard request');
      }

      const requestResponse = await fetch(`/api/enrollment/status?studentId=${studentId}`, {
        headers
      });
      
      if (requestResponse.ok) {
        const requestData = await requestResponse.json();
        // The new API returns enrollment data, extract the latest request from history
        const enrollmentData = requestData.enrollment;
        if (enrollmentData?.history && enrollmentData.history.length > 0) {
          const latestRequest = enrollmentData.history[0];
          setEnrollmentRequest({
            id: latestRequest.id,
            request_status: latestRequest.status,
            preferred_route_id: latestRequest.route || '',
            preferred_stop_id: latestRequest.stop || '',
            requested_at: latestRequest.date,
            admin_notes: latestRequest.notes,
            rejection_reason: latestRequest.rejection_reason
          });
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load enrollment data');
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
    setSelectedStop(null);
    // Route already contains stops data from the API
  };

  const handleStopSelect = (stop: RouteStop) => {
    setSelectedStop(stop);
  };

  const handleSubmitEnrollment = async () => {
    if (!selectedRoute || !selectedStop) {
      toast.error('Please select a route and stop');
      return;
    }

    setSubmitting(true);
    try {
      // Use the enhanced studentId from user context - prioritize JWT sub field
      const studentId = (user as any)?.sub || 
                       (user as any)?.studentId || 
                       student.id;
      
      // Enhanced debugging for student ID resolution
      console.log('🔍 Student ID resolution debug:', {
        finalStudentId: studentId,
        userSub: (user as any)?.sub,
        userStudentId: (user as any)?.studentId,
        studentPropId: student.id,
        userObject: user,
        studentObject: student
      });
      
      if (!studentId) {
        console.error('❌ No student ID available for enrollment request');
        toast.error('Unable to identify student. Please refresh the page and try again.');
        return;
      }
      
      console.log('🔍 Submitting enrollment with student ID:', studentId);
      
      // Get the access token to include in the request
      const accessToken = localStorage.getItem('tms_access_token') || 
                         document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];

      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Student-ID': studentId
      };

      if (accessToken) {
        requestHeaders['Authorization'] = `Bearer ${accessToken}`;
        console.log('🔑 Including access token in enrollment request submission');
      } else {
        console.log('⚠️ No access token found for enrollment request submission');
      }
      
      const response = await fetch('/api/enrollment/request', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({
          preferred_route_id: selectedRoute.id,
          preferred_stop_id: selectedStop.id,
          special_requirements: specialRequirements.trim() || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Handle both real and mock responses
        if (data.is_mock) {
          toast.success('Enrollment request simulated successfully! (Demo mode - data not persisted)');
        } else {
          toast.success('Enrollment request submitted successfully!');
        }
        setEnrollmentRequest(data.request);
        setShowEnrollmentForm(false);
        setSelectedRoute(null);
        setSelectedStop(null);
        setSpecialRequirements('');
      } else {
        // Enhanced error handling with more specific messages
        const errorMessage = data.error || 'Failed to submit enrollment request';
        console.error('❌ Enrollment request failed:', {
          status: response.status,
          error: errorMessage,
          studentId,
          selectedRoute: selectedRoute?.id,
          selectedStop: selectedStop?.id
        });
        
        if (response.status === 404 && errorMessage.includes('Student lookup failed')) {
          throw new Error('Student account not found. Please contact support to verify your enrollment in the system.');
        } else if (response.status === 404) {
          throw new Error('Student not found. Please refresh the page and try again, or contact support if the issue persists.');
        } else if (response.status === 400 && errorMessage.includes('already enrolled')) {
          throw new Error('You are already enrolled for transport services.');
        } else if (response.status === 400 && errorMessage.includes('pending enrollment request')) {
          throw new Error('You already have a pending enrollment request.');
        } else {
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error submitting enrollment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit enrollment request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading enrollment information...</p>
        </div>
      </div>
    );
  }

  // If student is already enrolled
  if (student.transport_enrolled) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-8 h-8 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-green-800">
              Transport Enrollment Active
            </h3>
            <p className="text-green-700">
              You are successfully enrolled in the transport service.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If student has a pending or rejected request
  if (enrollmentRequest) {
    const statusConfig = {
      pending: {
        icon: AlertCircle,
        color: 'yellow',
        title: 'Enrollment Request Pending',
        message: 'Your transport enrollment request is being reviewed by the admin.'
      },
      rejected: {
        icon: XCircle,
        color: 'red',
        title: 'Enrollment Request Rejected',
        message: 'Your transport enrollment request has been rejected.'
      },
      approved: {
        icon: CheckCircle,
        color: 'green',
        title: 'Enrollment Request Approved',
        message: 'Your transport enrollment request has been approved.'
      }
    };

    const config = statusConfig[enrollmentRequest.request_status as keyof typeof statusConfig];

    return (
      <div className={`bg-${config.color}-50 border border-${config.color}-200 rounded-lg p-6`}>
        <div className="flex items-start space-x-3">
          <config.icon className={`w-8 h-8 text-${config.color}-600 mt-1`} />
          <div className="flex-1">
            <h3 className={`text-lg font-semibold text-${config.color}-800 mb-2`}>
              {config.title}
            </h3>
            <p className={`text-${config.color}-700 mb-3`}>
              {config.message}
            </p>
            
            <div className="space-y-2 text-sm">
              <p className={`text-${config.color}-700`}>
                <strong>Requested on:</strong> {new Date(enrollmentRequest.requested_at).toLocaleDateString()}
              </p>
              
              {enrollmentRequest.rejection_reason && (
                <p className="text-red-700">
                  <strong>Reason:</strong> {enrollmentRequest.rejection_reason}
                </p>
              )}
              
              {enrollmentRequest.admin_notes && (
                <p className={`text-${config.color}-700`}>
                  <strong>Admin Notes:</strong> {enrollmentRequest.admin_notes}
                </p>
              )}
            </div>

            {enrollmentRequest.request_status === 'rejected' && (
              <button
                onClick={() => setShowEnrollmentForm(true)}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Submit New Request
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show enrollment form
  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Let's Get You Enrolled!
        </h3>
        <p className="text-gray-600">
          Follow these simple steps to set up your transport service
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
            selectedRoute ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-500'
          }`}>
            {selectedRoute ? <CheckCircle className="w-5 h-5" /> : '1'}
          </div>
          <div className={`w-16 h-0.5 ${
            selectedRoute ? 'bg-blue-600' : 'bg-gray-300'
          }`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
            selectedStop ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-500'
          }`}>
            {selectedStop ? <CheckCircle className="w-5 h-5" /> : '2'}
          </div>
          <div className={`w-16 h-0.5 ${
            selectedStop ? 'bg-blue-600' : 'bg-gray-300'
          }`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
            selectedRoute && selectedStop ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-500'
          }`}>
            {selectedRoute && selectedStop ? <CheckCircle className="w-5 h-5" /> : '3'}
          </div>
        </div>
      </div>

      {/* Step 1: Route Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            selectedRoute ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {selectedRoute ? <CheckCircle className="w-5 h-5" /> : '1'}
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900">
              Choose Your Route
            </h4>
            <p className="text-sm text-gray-600">
              Select the route that best fits your commute
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              isSelected={selectedRoute?.id === route.id}
              onClick={() => handleRouteSelect(route)}
            />
          ))}
        </div>
      </div>

      {/* Step 2: Stop Selection */}
      {selectedRoute && selectedRoute.stops && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-lg p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              selectedStop ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {selectedStop ? <CheckCircle className="w-5 h-5" /> : '2'}
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">
                Pick Your Boarding Stop
              </h4>
              <p className="text-sm text-gray-600">
                Choose where you'll board the transport
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedRoute.stops.map((stop) => (
              <StopCard
                key={stop.id}
                stop={stop}
                isSelected={selectedStop?.id === stop.id}
                onClick={() => handleStopSelect(stop)}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Step 3: Special Requirements */}
      {selectedRoute && selectedStop && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-lg p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              3
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">
                Special Requirements (Optional)
              </h4>
              <p className="text-sm text-gray-600">
                Let us know if you have any special needs
              </p>
            </div>
          </div>

          <textarea
            value={specialRequirements}
            onChange={(e) => setSpecialRequirements(e.target.value)}
            placeholder="Any special requirements or accessibility needs..."
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
        </motion.div>
      )}

      {/* Action Buttons */}
      {selectedRoute && selectedStop && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end space-x-4 pt-4"
        >
          <button
            onClick={() => {
              setSelectedRoute(null);
              setSelectedStop(null);
              setSpecialRequirements('');
            }}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Start Over
          </button>
          <button
            onClick={handleSubmitEnrollment}
            disabled={submitting}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 disabled:opacity-50 transition-all duration-200 font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Submit Enrollment</span>
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}

// Route Card Component
function RouteCard({ route, isSelected, onClick }: {
  route: Route;
  isSelected: boolean;
  onClick: () => void;
}) {
  const occupancyPercentage = ((route.capacity - route.availableSeats) / route.capacity) * 100;
  
  return (
    <div
      onClick={onClick}
      className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' 
          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h5 className="font-medium text-gray-900">{route.routeCode}</h5>
        <span className="text-sm text-gray-600">₹{route.fare}</span>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{route.routeName}</p>
      
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
        <div className="flex items-center">
          <MapPin className="w-3 h-3 mr-1" />
          <span>{route.startPoint}</span>
        </div>
        <div className="flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          <span>{route.schedule?.morning?.[0] || 'N/A'}</span>
        </div>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex items-center text-xs text-gray-500">
          <span>📍 {route.startPoint} → {route.endPoint}</span>
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <span>🕒 {route.estimatedTime} • {route.distance}</span>
        </div>
        {route.stops && route.stops.length > 0 && (
          <div className="flex items-center text-xs text-gray-500">
            <span>🚏 {route.stops.length} stops</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center text-xs text-gray-500">
          <Users className="w-3 h-3 mr-1" />
          <span>{route.capacity - route.availableSeats}/{route.capacity}</span>
        </div>
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              occupancyPercentage > 90 ? 'bg-red-500' :
              occupancyPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${occupancyPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Stop Card Component
function StopCard({ stop, isSelected, onClick }: {
  stop: RouteStop;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md scale-105' 
          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-gray-900 text-lg">{stop.name}</span>
            {stop.isMajor && (
              <span className="ml-2 inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                Major Stop
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">{stop.time}</div>
          <div className="text-xs text-gray-500">Stop #{stop.sequence}</div>
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        {stop.isMajor ? 'This is a major boarding point with more frequent service' : 'Regular boarding point'}
      </div>
    </div>
  );
} 