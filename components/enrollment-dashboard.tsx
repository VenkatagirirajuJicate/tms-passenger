'use client';

import React, { useState, useEffect } from 'react';
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
import { sessionManager } from '@/lib/session';

interface Route {
  id: string;
  route_number: string;
  route_name: string;
  start_location: string;
  end_location: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  distance: number;
  fare: number;
  total_capacity: number;
  current_passengers: number;
  route_stops?: RouteStop[];
}

interface RouteStop {
  id: string;
  route_id: string;
  stop_name: string;
  stop_time: string;
  sequence_order: number;
  is_major_stop: boolean;
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

      // Check if student has existing enrollment request
      const requestResponse = await fetch('/api/enrollment/status', {
        headers: {
          'Authorization': `Bearer ${sessionManager.getSession()?.session?.access_token}`,
          'X-Student-ID': student.id
        }
      });
      
      if (requestResponse.ok) {
        const requestData = await requestResponse.json();
        setEnrollmentRequest(requestData.request);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load enrollment data');
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSelect = async (route: Route) => {
    setSelectedRoute(route);
    setSelectedStop(null);
    
    // Fetch route stops
    try {
      const response = await fetch(`/api/routes/${route.id}/stops`);
      if (response.ok) {
        const stopsData = await response.json();
        setSelectedRoute({ ...route, route_stops: stopsData.stops });
      }
    } catch (error) {
      console.error('Error fetching route stops:', error);
    }
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
      const response = await fetch('/api/enrollment/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionManager.getSession()?.session?.access_token}`,
          'X-Student-ID': student.id
        },
        body: JSON.stringify({
          preferred_route_id: selectedRoute.id,
          preferred_stop_id: selectedStop.id,
          special_requirements: specialRequirements.trim() || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Enrollment request submitted successfully!');
        setEnrollmentRequest(data.request);
        setShowEnrollmentForm(false);
        setSelectedRoute(null);
        setSelectedStop(null);
        setSpecialRequirements('');
      } else {
        throw new Error(data.error || 'Failed to submit enrollment request');
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Bus className="w-8 h-8 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-blue-800">
              Enroll for Transport Service
            </h3>
            <p className="text-blue-700">
              Choose your preferred route and boarding stop to get started.
            </p>
          </div>
        </div>

        {!showEnrollmentForm ? (
          <button
            onClick={() => setShowEnrollmentForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Start Enrollment Process
          </button>
        ) : (
          <div className="space-y-6">
            {/* Route Selection */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">
                Step 1: Select Your Route
              </h4>
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

            {/* Stop Selection */}
            {selectedRoute && selectedRoute.route_stops && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Step 2: Select Your Boarding Stop
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedRoute.route_stops.map((stop) => (
                    <StopCard
                      key={stop.id}
                      stop={stop}
                      isSelected={selectedStop?.id === stop.id}
                      onClick={() => handleStopSelect(stop)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Special Requirements */}
            {selectedRoute && selectedStop && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Step 3: Special Requirements (Optional)
                </h4>
                <textarea
                  value={specialRequirements}
                  onChange={(e) => setSpecialRequirements(e.target.value)}
                  placeholder="Any special requirements or accessibility needs..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            )}

            {/* Submit Button */}
            {selectedRoute && selectedStop && (
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEnrollmentForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitEnrollment}
                  disabled={submitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Enrollment Request</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Route Card Component
function RouteCard({ route, isSelected, onClick }: {
  route: Route;
  isSelected: boolean;
  onClick: () => void;
}) {
  const occupancyPercentage = (route.current_passengers / route.total_capacity) * 100;
  
  return (
    <div
      onClick={onClick}
      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h5 className="font-medium text-gray-900">{route.route_number}</h5>
        <span className="text-sm text-gray-600">₹{route.fare}</span>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{route.route_name}</p>
      
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
        <div className="flex items-center">
          <MapPin className="w-3 h-3 mr-1" />
          <span>{route.start_location}</span>
        </div>
        <div className="flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          <span>{route.departure_time}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center text-xs text-gray-500">
          <Users className="w-3 h-3 mr-1" />
          <span>{route.current_passengers}/{route.total_capacity}</span>
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
      className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-sm' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">{stop.stop_name}</span>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="w-3 h-3 mr-1" />
          <span>{stop.stop_time}</span>
        </div>
      </div>
      {stop.is_major_stop && (
        <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
          Major Stop
        </span>
      )}
    </div>
  );
} 