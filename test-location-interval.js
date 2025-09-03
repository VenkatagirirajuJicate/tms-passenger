// Comprehensive Location Tracking Interval Test
// Run this in the browser console to test location tracking functionality

console.log('🧪 Testing Location Tracking Interval Functionality...');

let testResults = {
  geolocationAvailable: false,
  permissionStatus: 'unknown',
  initialPosition: null,
  apiTestSuccess: false,
  intervalUpdates: [],
  errors: []
};

// Test 1: Check if geolocation is available
function testGeolocationAvailability() {
  if (navigator.geolocation) {
    console.log('✅ Geolocation API is available');
    testResults.geolocationAvailable = true;
    return true;
  } else {
    console.log('❌ Geolocation API is not available');
    testResults.errors.push('Geolocation API not available');
    return false;
  }
}

// Test 2: Check location permission
async function testLocationPermission() {
  if (navigator.permissions) {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      console.log('🔍 Location permission status:', permission.state);
      testResults.permissionStatus = permission.state;
      return permission.state;
    } catch (error) {
      console.log('⚠️ Permission check failed:', error);
      testResults.errors.push('Permission check failed: ' + error.message);
      return 'unknown';
    }
  } else {
    console.log('⚠️ Permissions API not available');
    testResults.errors.push('Permissions API not available');
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
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString()
        };
        
        console.log('✅ Current position obtained:', locationData);
        testResults.initialPosition = locationData;
        resolve(position);
      },
      (error) => {
        const errorInfo = {
          code: error.code,
          message: error.message,
          timestamp: new Date().toISOString()
        };
        console.log('❌ Failed to get current position:', errorInfo);
        testResults.errors.push('Get current position failed: ' + error.message);
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

    if (data.success) {
      testResults.apiTestSuccess = true;
      return true;
    } else {
      testResults.errors.push('API test failed: ' + (data.error || 'Unknown error'));
      return false;
    }
  } catch (error) {
    console.log('❌ Location API test failed:', error);
    testResults.errors.push('API test failed: ' + error.message);
    return false;
  }
}

// Test 5: Monitor location updates at intervals
function startIntervalMonitoring(duration = 60000) { // Monitor for 1 minute
  console.log(`🔄 Starting interval monitoring for ${duration/1000} seconds...`);
  
  const startTime = Date.now();
  const intervalId = setInterval(async () => {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 // Force fresh location
        });
      });

      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp).toISOString(),
        testTime: new Date().toISOString()
      };

      console.log(`📍 Interval update ${testResults.intervalUpdates.length + 1}:`, locationData);
      testResults.intervalUpdates.push(locationData);

      // Test API call for each interval
      const apiSuccess = await testLocationAPI(
        position.coords.latitude,
        position.coords.longitude,
        position.coords.accuracy
      );

      if (apiSuccess) {
        console.log('✅ API call successful for interval update');
      } else {
        console.log('❌ API call failed for interval update');
      }

    } catch (error) {
      console.log('❌ Interval update failed:', error.message);
      testResults.errors.push('Interval update failed: ' + error.message);
    }

    // Stop monitoring after duration
    if (Date.now() - startTime >= duration) {
      clearInterval(intervalId);
      console.log('🛑 Interval monitoring completed');
      printTestResults();
    }
  }, 30000); // 30 second intervals

  return intervalId;
}

// Print comprehensive test results
function printTestResults() {
  console.log('\n📊 ===== LOCATION TRACKING TEST RESULTS =====');
  console.log('Geolocation Available:', testResults.geolocationAvailable);
  console.log('Permission Status:', testResults.permissionStatus);
  console.log('Initial Position:', testResults.initialPosition);
  console.log('API Test Success:', testResults.apiTestSuccess);
  console.log('Interval Updates Count:', testResults.intervalUpdates.length);
  console.log('Errors:', testResults.errors.length);
  
  if (testResults.intervalUpdates.length > 0) {
    console.log('\n📍 Interval Updates:');
    testResults.intervalUpdates.forEach((update, index) => {
      console.log(`  ${index + 1}. ${update.testTime} - Lat: ${update.latitude}, Lng: ${update.longitude}, Acc: ${update.accuracy}m`);
    });
  }
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors:');
    testResults.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
  
  // Overall assessment
  const success = testResults.geolocationAvailable && 
                  testResults.permissionStatus !== 'denied' && 
                  testResults.apiTestSuccess && 
                  testResults.intervalUpdates.length > 0;
  
  console.log('\n🎯 Overall Assessment:', success ? 'PASSED' : 'FAILED');
  
  if (success) {
    console.log('✅ Location tracking is working correctly at 30-second intervals!');
  } else {
    console.log('❌ Location tracking has issues that need to be addressed.');
  }
}

// Run comprehensive test
async function runComprehensiveTest() {
  console.log('🚀 Starting comprehensive location tracking test...');
  
  // Reset test results
  testResults = {
    geolocationAvailable: false,
    permissionStatus: 'unknown',
    initialPosition: null,
    apiTestSuccess: false,
    intervalUpdates: [],
    errors: []
  };
  
  // Test 1: Geolocation availability
  if (!testGeolocationAvailability()) {
    console.log('❌ Test failed: Geolocation not available');
    return;
  }
  
  // Test 2: Permission check
  const permission = await testLocationPermission();
  if (permission === 'denied') {
    console.log('❌ Test failed: Location permission denied');
    return;
  }
  
  // Test 3: Get initial position
  try {
    const position = await testGetCurrentPosition();
    
    // Test 4: API functionality
    const apiSuccess = await testLocationAPI(
      position.coords.latitude,
      position.coords.longitude,
      position.coords.accuracy
    );
    
    if (!apiSuccess) {
      console.log('❌ Test failed: API not working');
      return;
    }
    
    // Test 5: Start interval monitoring
    console.log('🔄 Starting interval monitoring...');
    startIntervalMonitoring(90000); // Monitor for 1.5 minutes (should get 3 updates)
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Export functions for manual testing
window.locationTrackingTest = {
  runComprehensiveTest,
  testGeolocationAvailability,
  testLocationPermission,
  testGetCurrentPosition,
  testLocationAPI,
  startIntervalMonitoring,
  printTestResults,
  getResults: () => testResults
};

console.log('💡 Run locationTrackingTest.runComprehensiveTest() to test location tracking functionality');
console.log('💡 Run locationTrackingTest.printTestResults() to see current test results');











