'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  School, 
  CreditCard,
  Shield,
  Edit,
  Save,
  X,
  Heart,
  AlertTriangle,
  CheckCircle,
  Building,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { studentHelpers } from '@/lib/supabase';
import { sessionManager } from '@/lib/session';
import { Student } from '@/types';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
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

      // Basic student data from session
      const studentData = {
        id: currentStudent.student_id,
        studentName: currentStudent.student_name,
        rollNumber: currentStudent.roll_number,
        email: sessionManager.getSession()?.user?.email || '',
        mobile: '',
        firstLoginCompleted: true,
        profileCompletionPercentage: 85,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Student;

      setStudent(studentData);

      // Fetch detailed student information including emergency contacts
      const detailedInfo = await studentHelpers.getStudentProfile(currentStudent.student_id);
      setStudentDetails(detailedInfo);

    } catch (error) {
      console.error('Error fetching student profile:', error);
      toast.error('Failed to load profile information');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Profile</h2>
        <p className="text-gray-600">Please refresh the page or try again later.</p>
      </div>
    );
  }



  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your personal information and preferences</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          {isEditing ? (
            <>
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Edit className="h-4 w-4" />
              <span>Edit Profile</span>
            </>
          )}
        </button>
      </div>

      {/* Profile Completion */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-medium text-blue-900">Profile Completion</h3>
              <p className="text-sm text-blue-700">
                Your profile is {student.profileCompletionPercentage}% complete
              </p>
            </div>
          </div>
        </div>
        <div className="bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${student.profileCompletionPercentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <User className="h-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
              <p className="text-gray-900 font-medium">{student.studentName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Roll Number</label>
              <p className="text-gray-900 font-medium">{student.rollNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
              <p className="text-gray-900">{student.email}</p>
            </div>
            {studentDetails?.mobile && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Mobile Number</label>
                <p className="text-gray-900">{studentDetails.mobile}</p>
              </div>
            )}
          </div>
        </div>

        {/* Emergency Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="h-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-900">Emergency Contact</h2>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Important Information</span>
            </div>
            <p className="text-sm text-red-700">
              This contact will be reached in case of emergencies during transport.
            </p>
          </div>
          
          <div className="space-y-4">
            {studentDetails?.emergencyContactName && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Emergency Contact Name</label>
                <p className="text-gray-900 font-semibold text-red-700">{studentDetails.emergencyContactName}</p>
              </div>
            )}
            {studentDetails?.emergencyContactPhone && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Emergency Contact Phone</label>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-red-600" />
                  <p className="text-gray-900 font-semibold text-red-700">{studentDetails.emergencyContactPhone}</p>
                </div>
              </div>
            )}
            
            {(!studentDetails?.emergencyContactName || !studentDetails?.emergencyContactPhone) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Action Required</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Emergency contact information is missing. Please contact the admin office to update this information.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
} 