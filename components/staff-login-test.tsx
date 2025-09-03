'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { staffAuthService } from '@/lib/auth/staff-auth-service';
import { staffHelpers } from '@/lib/staff-helpers';
import { CheckCircle, AlertCircle, Info, User, Shield, Building } from 'lucide-react';

export default function StaffLoginTest() {
  const { user, userType, isAuthenticated } = useAuth();
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runStaffTests = async () => {
    setLoading(true);
    setTestResults(null);

    try {
      const results = {
        timestamp: new Date().toISOString(),
        currentUser: {
          email: user?.email,
          role: user?.role,
          userType,
          isAuthenticated,
          permissions: user?.permissions
        },
        staffApiTest: null,
        staffAuthTest: null,
        staffHelpersTest: null
      };

      // Test 1: Staff API endpoint
      try {
        console.log('🧪 Testing staff API endpoint...');
        const response = await fetch('/api/staff');
        const data = await response.json();
        
        results.staffApiTest = {
          success: response.ok,
          status: response.status,
          data: data.success ? {
            totalStaff: data.total,
            sampleStaff: data.staff?.[0]?.email || 'No staff found'
          } : data.error
        };
      } catch (error) {
        results.staffApiTest = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Test 2: Staff Auth Service
      if (user?.email) {
        try {
          console.log('🧪 Testing staff auth service...');
          const staffData = await staffAuthService.checkStaffStatus(user.email);
          
          results.staffAuthTest = {
            success: true,
            isStaff: staffData.isStaff,
            role: staffData.role,
            staffMember: staffData.staffMember ? {
              email: staffData.staffMember.email,
              fullName: staffData.staffMember.full_name,
              designation: staffData.staffMember.designation,
              department: staffData.staffMember.department
            } : null
          };
        } catch (error) {
          results.staffAuthTest = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }

      // Test 3: Staff Helpers
      try {
        console.log('🧪 Testing staff helpers...');
        const allStaff = await staffHelpers.getAllStaff();
        const stats = await staffHelpers.getStaffStats();
        
        results.staffHelpersTest = {
          success: true,
          totalStaff: allStaff.length,
          stats: {
            total: stats.totalStaff,
            active: stats.activeStaff,
            teaching: stats.teachingStaff,
            departments: Object.keys(stats.byDepartment).length
          }
        };
      } catch (error) {
        results.staffHelpersTest = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      setTestResults(results);
      console.log('✅ Staff tests completed:', results);

    } catch (error) {
      console.error('❌ Error running staff tests:', error);
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    staffHelpers.clearCache();
    console.log('🗑️ Staff cache cleared');
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Staff Login Flow Test</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Current User:</span>
          <span className={`text-sm font-medium px-2 py-1 rounded-full ${
            userType === 'staff' ? 'bg-purple-100 text-purple-800' :
            userType === 'passenger' ? 'bg-blue-100 text-blue-800' :
            userType === 'driver' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {userType || 'Not logged in'}
          </span>
        </div>
      </div>

      {/* Current User Info */}
      {user && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <User className="w-4 h-4 mr-2" />
            Current User Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Email:</span>
              <span className="ml-2 font-medium">{user.email}</span>
            </div>
            <div>
              <span className="text-gray-600">Role:</span>
              <span className="ml-2 font-medium">{user.role || 'Not set'}</span>
            </div>
            <div>
              <span className="text-gray-600">User Type:</span>
              <span className="ml-2 font-medium">{userType || 'Not set'}</span>
            </div>
            <div>
              <span className="text-gray-600">Staff ID:</span>
              <span className="ml-2 font-medium">{user.staff_id || 'Not set'}</span>
            </div>
            {user.department && (
              <div>
                <span className="text-gray-600">Department:</span>
                <span className="ml-2 font-medium">{user.department}</span>
              </div>
            )}
            {user.designation && (
              <div>
                <span className="text-gray-600">Designation:</span>
                <span className="ml-2 font-medium">{user.designation}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test Controls */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={runStaffTests}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Running Tests...' : 'Run Staff Tests'}
        </button>
        
        <button
          onClick={clearCache}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Clear Cache
        </button>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Test Results</h3>
          
          {/* Staff API Test */}
          {testResults.staffApiTest && (
            <div className={`p-4 rounded-lg border ${
              testResults.staffApiTest.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center mb-2">
                {testResults.staffApiTest.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <span className="font-medium">Staff API Endpoint</span>
              </div>
              <div className="text-sm">
                {testResults.staffApiTest.success ? (
                  <div>
                    <p>Status: {testResults.staffApiTest.status}</p>
                    <p>Total Staff: {testResults.staffApiTest.data.totalStaff}</p>
                    <p>Sample: {testResults.staffApiTest.data.sampleStaff}</p>
                  </div>
                ) : (
                  <p className="text-red-600">{testResults.staffApiTest.error}</p>
                )}
              </div>
            </div>
          )}

          {/* Staff Auth Service Test */}
          {testResults.staffAuthTest && (
            <div className={`p-4 rounded-lg border ${
              testResults.staffAuthTest.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center mb-2">
                {testResults.staffAuthTest.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <span className="font-medium">Staff Auth Service</span>
              </div>
              <div className="text-sm">
                {testResults.staffAuthTest.success ? (
                  <div>
                    <p>Is Staff: {testResults.staffAuthTest.isStaff ? 'Yes' : 'No'}</p>
                    <p>Role: {testResults.staffAuthTest.role}</p>
                    {testResults.staffAuthTest.staffMember && (
                      <div className="mt-2 p-2 bg-white rounded border">
                        <p><strong>Staff Member:</strong></p>
                        <p>Name: {testResults.staffAuthTest.staffMember.fullName}</p>
                        <p>Designation: {testResults.staffAuthTest.staffMember.designation}</p>
                        <p>Department: {testResults.staffAuthTest.staffMember.department}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-red-600">{testResults.staffAuthTest.error}</p>
                )}
              </div>
            </div>
          )}

          {/* Staff Helpers Test */}
          {testResults.staffHelpersTest && (
            <div className={`p-4 rounded-lg border ${
              testResults.staffHelpersTest.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center mb-2">
                {testResults.staffHelpersTest.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <span className="font-medium">Staff Helpers</span>
              </div>
              <div className="text-sm">
                {testResults.staffHelpersTest.success ? (
                  <div>
                    <p>Total Staff: {testResults.staffHelpersTest.stats.total}</p>
                    <p>Active Staff: {testResults.staffHelpersTest.stats.active}</p>
                    <p>Teaching Staff: {testResults.staffHelpersTest.stats.teaching}</p>
                    <p>Departments: {testResults.staffHelpersTest.stats.departments}</p>
                  </div>
                ) : (
                  <p className="text-red-600">{testResults.staffHelpersTest.error}</p>
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-xs text-gray-500 text-center">
            Tests run at: {new Date(testResults.timestamp).toLocaleString()}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center">
          <Info className="w-4 h-4 mr-2" />
          How to Test Staff Login
        </h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Log in with a staff member's email through the regular OAuth flow</li>
          <li>The system should automatically detect if the user is staff</li>
          <li>If staff, the user should be redirected to the staff dashboard</li>
          <li>Run these tests to verify the staff detection is working</li>
          <li>Check the console for detailed logs of the staff detection process</li>
        </ol>
      </div>
    </div>
  );
}

