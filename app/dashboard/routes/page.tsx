'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Users, 
  DollarSign,
  Bus,
  Navigation,
  Calendar,
  Info,
  Route as RouteIcon,
  AlertCircle,
  CheckCircle,
  User,
  Phone,
  Car,
  Zap,
  MapIcon,
  Star
} from 'lucide-react';
import { studentHelpers } from '@/lib/supabase';
import { sessionManager } from '@/lib/session';
import { Route, Schedule, Student, RouteStop } from '@/types';

// Interface for the formatted student allocation
interface StudentAllocation {
  route: Route | null;
  boardingStop: RouteStop | null;
  allocation: {
    id: string | null;
    allocatedAt: Date | null;
    isActive: boolean;
  };
}
import { formatTime, formatCurrency, capitalizeFirst } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function RoutesPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [allocation, setAllocation] = useState<StudentAllocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [routeSchedules, setRouteSchedules] = useState<Schedule[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);

  useEffect(() => {
    fetchStudentRouteData();
  }, []);

  const fetchStudentRouteData = async () => {
    try {
      // Check authentication using session manager
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

      // Set student data from session
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

      // Fetch student's allocated route using the same method as schedules page
      const allocationData = await studentHelpers.getStudentRouteAllocationFormatted(currentStudent.student_id);
      
      if (allocationData && allocationData.route) {
        // Transform to match the expected interface
        const transformedAllocation = {
          route: {
            id: allocationData.route.id,
            routeName: allocationData.route.routeName,
            routeNumber: allocationData.route.routeNumber,
            startLocation: allocationData.route.startLocation,
            endLocation: allocationData.route.endLocation,
            departureTime: allocationData.route.departureTime,
            arrivalTime: allocationData.route.arrivalTime,
            fare: allocationData.route.fare,
            distance: 0, // Will be updated if needed
            duration: 'N/A', // Will be updated if needed
            totalCapacity: 0, // Will be updated if needed
            currentPassengers: 0, // Will be updated if needed
            status: 'active' as const,
            stops: [], // Will be populated below
            createdAt: new Date(),
            updatedAt: new Date()
          },
          boardingStop: allocationData.boardingStop ? {
            id: allocationData.boardingStop.id,
            routeId: allocationData.route.id,
            stopName: allocationData.boardingStop.stopName,
            stopTime: allocationData.boardingStop.stopTime,
            sequenceOrder: 0,
            latitude: 0,
            longitude: 0,
            isMajorStop: false,
            createdAt: new Date()
          } : null,
          allocation: allocationData.allocation
        };
        
        setAllocation(transformedAllocation);
        
        // Fetch additional route details to get complete information
        try {
          const completeRouteData = await studentHelpers.getStudentAllocatedRoute(currentStudent.student_id);
          if (completeRouteData?.route) {
            // Update the allocation with complete route data
            setAllocation(prev => {
              if (!prev) return null;
              
              return {
                ...prev,
                route: {
                  ...prev.route,
                  distance: completeRouteData.route?.distance || prev.route.distance,
                  duration: completeRouteData.route?.duration || prev.route.duration,
                  totalCapacity: completeRouteData.route?.totalCapacity || prev.route.totalCapacity,
                  currentPassengers: completeRouteData.route?.currentPassengers || prev.route.currentPassengers,
                  status: completeRouteData.route?.status || prev.route.status,
                  stops: completeRouteData.route?.stops || prev.route.stops
                },
                boardingStop: completeRouteData.boardingStop || prev.boardingStop
              };
            });
          }
        } catch (error) {
          console.warn('Could not fetch complete route data, using basic data:', error);
        }
             } else {
         setAllocation(null);
       }

      if (allocationData && allocationData.route) {
        // Auto-load schedules for the allocated route
        await loadRouteSchedules({
          id: allocationData.route.id,
          routeName: allocationData.route.routeName,
          routeNumber: allocationData.route.routeNumber,
          startLocation: allocationData.route.startLocation,
          endLocation: allocationData.route.endLocation,
          departureTime: allocationData.route.departureTime,
          arrivalTime: allocationData.route.arrivalTime,
          fare: allocationData.route.fare,
          distance: 0,
          duration: 'N/A',
          totalCapacity: 0,
          currentPassengers: 0,
          status: 'active' as const,
          stops: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error fetching student route data:', error);
      toast.error('Failed to load route information');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRouteSchedules = async (route: Route) => {
    setIsLoadingSchedules(true);
    
    try {
      // Fetch schedules for the next 7 days
      const dateFrom = new Date().toISOString().split('T')[0];
      const dateTo = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const schedules = await studentHelpers.getRouteSchedules(route.id, dateFrom, dateTo);
      setRouteSchedules(schedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to load schedules');
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const handleViewDetails = (route: Route) => {
    setSelectedRoute(route);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-gray-200 rounded-lg h-64"></div>
        </div>
      </div>
    );
  }

  // No route allocated
  if (!allocation?.route) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Transport Route</h1>
          <p className="text-gray-600">Your allocated transport route and boarding information</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">No Route Allocated</h2>
          <p className="text-yellow-800 mb-4">
            You haven't been assigned to any transport route yet. 
          </p>
          <p className="text-sm text-yellow-700">
            Please contact the transport office to get your route assignment.
          </p>
        </div>
      </div>
    );
  }

  const { route, boardingStop } = allocation;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Transport Route</h1>
        <p className="text-gray-600">Your allocated transport route and boarding information</p>
      </div>

      {/* Route Status Card */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-blue-900">Route Allocated</h2>
            <p className="text-blue-700">You are assigned to route {route.routeNumber}</p>
          </div>
        </div>
      </div>

      {/* Main Route Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{route.routeName}</h2>
              <p className="text-blue-100">Route {route.routeNumber}</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                route.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {capitalizeFirst(route.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Route Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">From</span>
              </div>
              <p className="font-semibold text-gray-900">{route.startLocation}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Navigation className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">To</span>
              </div>
              <p className="font-semibold text-gray-900">{route.endLocation}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">Departure</span>
              </div>
              <p className="font-semibold text-gray-900">{formatTime(route.departureTime)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">Fare</span>
              </div>
              <p className="font-semibold text-gray-900">{formatCurrency(route.fare)}</p>
            </div>
          </div>

          {/* Your Boarding Stop */}
          {boardingStop && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Your Boarding Stop</h3>
                  <p className="text-green-700">This is where you'll board the bus</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Stop Name</p>
                    <p className="font-semibold text-gray-900 text-lg">{boardingStop.stopName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Arrival Time</p>
                    <p className="font-semibold text-gray-900 text-lg">{formatTime(boardingStop.stopTime)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Stop Position</p>
                    <p className="font-semibold text-gray-900 text-lg">
                      Stop #{boardingStop.sequenceOrder}
                      {boardingStop.isMajorStop && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Star className="h-3 w-3 mr-1" />
                          Major
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Route Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Route Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-medium">{route.distance} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{route.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Stops:</span>
                  <span className="font-medium">{route.stops.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-medium">{route.currentPassengers}/{route.totalCapacity}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Timing</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Departure:</span>
                  <span className="font-medium">{formatTime(route.departureTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Arrival:</span>
                  <span className="font-medium">{formatTime(route.arrivalTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Your Stop:</span>
                  <span className="font-medium text-green-600">
                    {boardingStop ? formatTime(boardingStop.stopTime) : 'Not set'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleViewDetails(route)}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Info className="h-5 w-5" />
              <span>View All Stops & Schedule</span>
            </button>
            <button
              onClick={() => loadRouteSchedules(route)}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Calendar className="h-5 w-5" />
              <span>View Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Schedules */}
      {routeSchedules.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Upcoming Schedule (Next 7 Days)
          </h3>
          {isLoadingSchedules ? (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {routeSchedules.map((schedule) => (
                <div key={schedule.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(schedule.scheduleDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-gray-500">
                          Departs at {formatTime(schedule.departureTime)}
                          {boardingStop && (
                            <span className="ml-2 text-green-600 font-medium">
                              • Your stop: {formatTime(boardingStop.stopTime)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Available Seats</p>
                      <p className="font-medium text-gray-900">
                        {schedule.availableSeats}/{schedule.availableSeats + schedule.bookedSeats}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Route Details Modal */}
      {selectedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedRoute.routeName}</h2>
                <p className="text-gray-600">Route {selectedRoute.routeNumber} - Complete Route Map</p>
              </div>
              <button
                onClick={() => setSelectedRoute(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Route Overview */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Route Overview</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">From</p>
                      <p className="font-medium text-gray-900">{selectedRoute.startLocation}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">To</p>
                      <p className="font-medium text-gray-900">{selectedRoute.endLocation}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Distance</p>
                      <p className="font-medium text-gray-900">{selectedRoute.distance}km</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-medium text-gray-900">{selectedRoute.duration}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* All Stops with Your Stop Highlighted */}
              {selectedRoute.stops && selectedRoute.stops.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Complete Route Map</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      {selectedRoute.stops
                        .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                        .map((stop, index) => {
                          const isYourStop = boardingStop && stop.id === boardingStop.id;
                          return (
                            <div 
                              key={stop.id} 
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                isYourStop 
                                  ? 'bg-green-100 border-2 border-green-300' 
                                  : 'bg-white border border-gray-200'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                  isYourStop 
                                    ? 'bg-green-500 text-white' 
                                    : stop.isMajorStop 
                                      ? 'bg-blue-500 text-white' 
                                      : 'bg-gray-300 text-gray-600'
                                }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <span className={`font-medium ${
                                    isYourStop 
                                      ? 'text-green-900' 
                                      : stop.isMajorStop 
                                        ? 'text-blue-900' 
                                        : 'text-gray-900'
                                  }`}>
                                    {stop.stopName}
                                    {isYourStop && (
                                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-200 text-green-800">
                                        <User className="h-3 w-3 mr-1" />
                                        Your Stop
                                      </span>
                                    )}
                                    {stop.isMajorStop && !isYourStop && (
                                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        <Star className="h-3 w-3 mr-1" />
                                        Major
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                              <span className={`text-sm font-medium ${
                                isYourStop ? 'text-green-700' : 'text-gray-500'
                              }`}>
                                {formatTime(stop.stopTime)}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 