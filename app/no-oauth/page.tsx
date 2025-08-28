'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Car, Users, ArrowRight, Shield } from 'lucide-react';

export default function NoOAuthPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-4xl font-bold text-gray-900">
            Direct Authentication
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Choose your login method - No OAuth required
          </p>
        </div>

        {/* Login Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Driver Login */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Car className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Driver Login
              </h3>
              <p className="text-gray-600 mb-6">
                Direct authentication for drivers
              </p>
              <button
                onClick={() => router.push('/driver/login')}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Login as Driver</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Passenger Login */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Passenger Login
              </h3>
              <p className="text-gray-600 mb-6">
                Direct authentication for passengers
              </p>
              <button
                onClick={() => router.push('/login?mode=direct')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Login as Passenger</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
            Why Direct Authentication?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">No OAuth complications</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">No confirmation token errors</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Works when parent app is down</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Faster login process</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Direct database authentication</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Better error handling</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back to OAuth */}
        <div className="text-center">
          <button
            onClick={() => router.push('/login')}
            className="text-gray-500 hover:text-gray-700 underline text-sm"
          >
            ← Back to OAuth login (if you prefer)
          </button>
        </div>
      </div>
    </div>
  );
}
