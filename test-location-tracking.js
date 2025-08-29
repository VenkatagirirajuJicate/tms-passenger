// Test script for location tracking functionality
// Run this in the browser console to test location tracking

console.log('🧪 Testing Location Tracking...');

// Test 1: Check if geolocation is available
if (navigator.geolocation) {
  console.log('✅ Geolocation API is available');
} else {
  console.log('❌ Geolocation API is not available');
}

// Test 2: Check location permission
async function checkPermission() {
  if (navigator.permissions) {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      console.log('🔍 Location permission status:', permission.state);
      return permission.state;
    } catch (error) {
      console.log('⚠️ Permission check failed:', error);
      return 'unknown';
    }
  } else {
    console.log('⚠️ Permissions API not available');
    return 'unknown';
  }
}

// Test 3: Get current position
function testGetCurrentPosition() {
  return new Promise((resolve, reject) => {
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ Current position obtained:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString()
        });
        resolve(position);
      },
      (error) => {
        console.log('❌ Failed to get current position:', {
          code: error.code,
          message: error.message
        });
        reject(error);
      },
      options
    );
  });
}

// Test 4: Test location update API
async function testLocationAPI(latitude, longitude, accuracy) {
  try {
    const response = await fetch('/api/driver/location/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        driverId: '7720530b-25fc-423e-908d-17f2e0682afb', // Parent app ID
        email: 'arthanareswaran22@jkkn.ac.in',
        latitude: latitude,
        longitude: longitude,
        accuracy: accuracy,
        timestamp: Date.now()
      }),
    });

    const data = await response.json();
    console.log('🔍 Location API response:', {
      status: response.status,
      success: data.success,
      error: data.error
    });

    return data.success;
  } catch (error) {
    console.log('❌ Location API test failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting location tracking tests...');
  
  // Test permission
  const permission = await checkPermission();
  
  if (permission === 'denied') {
    console.log('❌ Location permission denied. Please enable location access.');
    return;
  }
  
  // Test getting position
  try {
    const position = await testGetCurrentPosition();
    
    // Test API call
    const apiSuccess = await testLocationAPI(
      position.coords.latitude,
      position.coords.longitude,
      position.coords.accuracy
    );
    
    if (apiSuccess) {
      console.log('🎉 All location tracking tests passed!');
    } else {
      console.log('⚠️ Location API test failed');
    }
  } catch (error) {
    console.log('❌ Location tracking test failed:', error);
  }
}

// Export for manual testing
window.testLocationTracking = runAllTests;
console.log('💡 Run testLocationTracking() to test location functionality');
