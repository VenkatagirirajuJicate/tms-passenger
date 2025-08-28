'use client';

import React from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, Bus, CreditCard } from 'lucide-react';
import { useEnrollmentStatus, useEnrollment } from '@/lib/enrollment/enrollment-context';

export default function EnrollmentStatusBanner() {
  const enrollmentStatus = useEnrollmentStatus();
  const { isLoading, error, refreshEnrollmentStatus } = useEnrollment();

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-blue-700 font-medium">Checking enrollment status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    // Handle "student not found" as a warning, not an error
    if (error.includes('Student record not found')) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
              <div>
                <span className="text-yellow-700 font-medium">Student Record Setup Needed</span>
                <p className="text-yellow-600 text-sm mt-1">
                  Your student record needs to be set up in the transport system. You can still enroll for services.
                </p>
              </div>
            </div>
            <button
              onClick={refreshEnrollmentStatus}
              className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    // Handle other errors as actual errors
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-3" />
            <div>
              <span className="text-red-700 font-medium">Failed to check enrollment status</span>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={refreshEnrollmentStatus}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!enrollmentStatus) {
    return null;
  }

  const { isEnrolled, enrollmentStatus: status, hasActiveRequest, requestStatus, transportStatus } = enrollmentStatus;

  // Enrolled status
  if (isEnrolled) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            <div>
              <span className="text-green-700 font-medium">Transport Enrollment Active</span>
              <p className="text-green-600 text-sm mt-1">
                Status: {transportStatus} • All transport features are available
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Bus className="h-4 w-4 text-green-500" />
            <span className="text-green-600 text-sm font-medium">Enrolled</span>
          </div>
        </div>
      </div>
    );
  }

  // Active request status
  if (hasActiveRequest) {
    const getRequestStatusInfo = () => {
      switch (requestStatus) {
        case 'pending':
          return {
            icon: Clock,
            color: 'yellow',
            title: 'Enrollment Request Pending',
            description: 'Your enrollment request is being reviewed by the admin team'
          };
        case 'approved':
          return {
            icon: CheckCircle,
            color: 'green',
            title: 'Enrollment Request Approved',
            description: 'Your request has been approved. Complete payment to activate transport services'
          };
        case 'rejected':
          return {
            icon: XCircle,
            color: 'red',
            title: 'Enrollment Request Rejected',
            description: 'Your enrollment request was not approved. You can submit a new request'
          };
        default:
          return {
            icon: AlertTriangle,
            color: 'gray',
            title: 'Enrollment Request Status Unknown',
            description: 'Please contact support for assistance'
          };
      }
    };

    const statusInfo = getRequestStatusInfo();
    const IconComponent = statusInfo.icon;

    return (
      <div className={`bg-${statusInfo.color}-50 border border-${statusInfo.color}-200 rounded-lg p-4 mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <IconComponent className={`h-5 w-5 text-${statusInfo.color}-500 mr-3`} />
            <div>
              <span className={`text-${statusInfo.color}-700 font-medium`}>{statusInfo.title}</span>
              <p className={`text-${statusInfo.color}-600 text-sm mt-1`}>{statusInfo.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className={`h-4 w-4 text-${statusInfo.color}-500`} />
            <span className={`text-${statusInfo.color}-600 text-sm font-medium capitalize`}>
              {requestStatus}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Not enrolled, no active request
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-blue-500 mr-3" />
          <div>
            <span className="text-blue-700 font-medium">Transport Enrollment Required</span>
            <p className="text-blue-600 text-sm mt-1">
              Enroll for transport services to access routes, schedules, and live tracking
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <CreditCard className="h-4 w-4 text-blue-500" />
          <span className="text-blue-600 text-sm font-medium">Not Enrolled</span>
        </div>
      </div>
    </div>
  );
}
