// Debug Location Tracking Issues
// Run this in the browser console to diagnose location tracking problems

console.log('🔧 Starting Location Tracking Debug...');

const debugResults = {
  timestamp: new Date().toISOString(),
  geolocationAvailable: false,
  permissionStatus: 'unknown',
  networkStatus: 'unknown',
  apiEndpoint: '/api/driver/location/update',
  testResults: [],
  errors: []
};

// Test 1: Check geolocation availability
function testGeolocation() {
  console.log('📍 Testing Geolocation API...');
  
  if (navigator.geolocation) {
    debugResults.geolocationAvailable = true;
    console.log('✅ Geolocation API is available');
    return true;
  } else {
    debugResults.errors.push('Geolocation API not available');
    console.log('❌ Geolocation API is not available');
    return false;
  }
}

// Test 2: Check location permission
async function testPermission() {
  console.log('🔐 Testing Location Permission...');
  
  if (navigator.permissions) {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      debugResults.permissionStatus = permission.state;
      console.log('📍 Permission status:', permission.state);
      return permission.state;
    } catch (error) {
      debugResults.errors.push('Permission check failed: ' + error.message);
      console.log('⚠️ Permission check failed:', error);
      return 'unknown';
    }
  } else {
    debugResults.errors.push('Permissions API not available');
    console.log('⚠️ Permissions API not available');
    return 'unknown';
  }
}

// Test 3: Check network connectivity
function testNetwork() {
  console.log('🌐 Testing Network Connectivity...');
  
  if (navigator.onLine) {
    debugResults.networkStatus = 'online';
    console.log('✅ Network is online');
    return true;
  } else {
    debugResults.networkStatus = 'offline';
    debugResults.errors.push('Network is offline');
    console.log('❌ Network is offline');
    return false;
  }
}

// Test 4: Test location API endpoint
async function testLocationAPI() {
  console.log('🔗 Testing Location API Endpoint...');
  
  const testData = {
    driverId: 'test-driver-id',
    email: 'test@example.com',
    latitude: 12.9716,
    longitude: 77.5946,
    accuracy: 10,
    timestamp: Date.now()
  };
  
  try {
    const response = await fetch(debugResults.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    const data = await response.json();
    
    const result = {
      status: response.status,
      success: data.success,
      error: data.error,
      timestamp: new Date().toISOString()
    };
    
    debugResults.testResults.push(result);
    
    if (response.ok && data.success) {
      console.log('✅ API endpoint is working');
      return true;
    } else {
      console.log('❌ API endpoint failed:', result);
      return false;
    }
  } catch (error) {
    const result = {
      status: 'error',
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    debugResults.testResults.push(result);
    debugResults.errors.push('API test failed: ' + error.message);
    console.log('❌ API test failed:', error);
    return false;
  }
}

// Test 5: Get current position
function testGetPosition() {
  console.log('📍 Testing Get Current Position...');
  
  return new Promise((resolve, reject) => {
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
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
        resolve(locationData);
      },
      (error) => {
        const errorInfo = {
          code: error.code,
          message: error.message,
          timestamp: new Date().toISOString()
        };
        
        debugResults.errors.push('Get position failed: ' + error.message);
        console.log('❌ Failed to get current position:', errorInfo);
        reject(error);
      },
      options
    );
  });
}

// Test 6: Monitor interval updates
function testIntervalUpdates(duration = 60000) {
  console.log(`⏰ Testing Interval Updates for ${duration/1000} seconds...`);
  
  const startTime = Date.now();
  const updates = [];
  let updateCount = 0;
  
  const intervalId = setInterval(async () => {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });
      
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp).toISOString(),
        testTime: new Date().toISOString(),
        updateNumber: ++updateCount
      };
      
      updates.push(locationData);
      console.log(`📍 Interval update ${updateCount}:`, locationData);
      
      // Test API call
      const apiSuccess = await testLocationAPI();
      if (apiSuccess) {
        console.log(`✅ API call successful for update ${updateCount}`);
      } else {
        console.log(`❌ API call failed for update ${updateCount}`);
      }
      
    } catch (error) {
      console.log(`❌ Interval update ${updateCount + 1} failed:`, error.message);
      debugResults.errors.push(`Interval update ${updateCount + 1} failed: ${error.message}`);
    }
    
    // Stop after duration
    if (Date.now() - startTime >= duration) {
      clearInterval(intervalId);
      console.log('🛑 Interval testing completed');
      console.log(`📊 Total updates: ${updates.length}`);
      
      debugResults.intervalUpdates = updates;
      printDebugResults();
    }
  }, 30000); // 30 second intervals
  
  return intervalId;
}

// Print comprehensive debug results
function printDebugResults() {
  console.log('\n📊 ===== LOCATION TRACKING DEBUG RESULTS =====');
  console.log('Timestamp:', debugResults.timestamp);
  console.log('Geolocation Available:', debugResults.geolocationAvailable);
  console.log('Permission Status:', debugResults.permissionStatus);
  console.log('Network Status:', debugResults.networkStatus);
  console.log('API Endpoint:', debugResults.apiEndpoint);
  console.log('Test Results Count:', debugResults.testResults.length);
  console.log('Errors Count:', debugResults.errors.length);
  
  if (debugResults.testResults.length > 0) {
    console.log('\n🔗 API Test Results:');
    debugResults.testResults.forEach((result, index) => {
      console.log(`  ${index + 1}. Status: ${result.status}, Success: ${result.success}, Error: ${result.error || 'None'}`);
    });
  }
  
  if (debugResults.intervalUpdates && debugResults.intervalUpdates.length > 0) {
    console.log('\n⏰ Interval Updates:');
    debugResults.intervalUpdates.forEach((update, index) => {
      console.log(`  ${index + 1}. ${update.testTime} - Lat: ${update.latitude}, Lng: ${update.longitude}, Acc: ${update.accuracy}m`);
    });
  }
  
  if (debugResults.errors.length > 0) {
    console.log('\n❌ Errors:');
    debugResults.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
  
  // Overall assessment
  const success = debugResults.geolocationAvailable && 
                  debugResults.permissionStatus !== 'denied' && 
                  debugResults.networkStatus === 'online' &&
                  debugResults.testResults.some(r => r.success);
  
  console.log('\n🎯 Overall Assessment:', success ? 'PASSED' : 'FAILED');
  
  if (success) {
    console.log('✅ Location tracking should be working correctly!');
  } else {
    console.log('❌ Location tracking has issues that need to be addressed.');
    
    if (!debugResults.geolocationAvailable) {
      console.log('💡 Fix: Browser does not support geolocation');
    }
    if (debugResults.permissionStatus === 'denied') {
      console.log('💡 Fix: Location permission is denied - enable in browser settings');
    }
    if (debugResults.networkStatus === 'offline') {
      console.log('💡 Fix: Network is offline - check internet connection');
    }
    if (!debugResults.testResults.some(r => r.success)) {
      console.log('💡 Fix: API endpoint is not working - check server status');
    }
  }
}

// Run comprehensive debug
async function runDebug() {
  console.log('🚀 Starting comprehensive location tracking debug...');
  
  // Reset debug results
  debugResults.timestamp = new Date().toISOString();
  debugResults.testResults = [];
  debugResults.errors = [];
  
  // Test 1: Geolocation availability
  if (!testGeolocation()) {
    console.log('❌ Debug failed: Geolocation not available');
    return;
  }
  
  // Test 2: Permission check
  const permission = await testPermission();
  if (permission === 'denied') {
    console.log('❌ Debug failed: Location permission denied');
    return;
  }
  
  // Test 3: Network connectivity
  if (!testNetwork()) {
    console.log('❌ Debug failed: Network is offline');
    return;
  }
  
  // Test 4: API functionality
  const apiSuccess = await testLocationAPI();
  if (!apiSuccess) {
    console.log('❌ Debug failed: API not working');
    return;
  }
  
  // Test 5: Get initial position
  try {
    await testGetPosition();
  } catch (error) {
    console.log('❌ Debug failed: Cannot get current position');
    return;
  }
  
  // Test 6: Start interval monitoring
  console.log('🔄 Starting interval monitoring...');
  testIntervalUpdates(90000); // Monitor for 1.5 minutes
  
}

// Export functions for manual testing
window.locationTrackingDebug = {
  runDebug,
  testGeolocation,
  testPermission,
  testNetwork,
  testLocationAPI,
  testGetPosition,
  testIntervalUpdates,
  printDebugResults,
  getResults: () => debugResults
};

console.log('💡 Run locationTrackingDebug.runDebug() to debug location tracking issues');
console.log('💡 Run locationTrackingDebug.printDebugResults() to see current debug results');
