// Driver Data Fetching Test Script
// Run this in the browser console after driver login to verify data fetching

console.log('🚗 Driver Data Fetching Test');
console.log('============================');

// Test 1: Check Authentication State
console.log('\n1️⃣ Checking Authentication State...');
const authState = {
  isAuthenticated: window.authContext?.isAuthenticated || false,
  userType: window.authContext?.userType || 'unknown',
  user: window.authContext?.user || null,
  isLoading: window.authContext?.isLoading || false
};

console.log('Auth State:', authState);

if (!authState.isAuthenticated) {
  console.log('❌ Driver not authenticated. Please login first.');
  console.log('💡 Navigate to /login and use driver credentials');
  return;
}

if (authState.userType !== 'driver') {
  console.log('❌ User is not a driver. Current user type:', authState.userType);
  return;
}

console.log('✅ Driver authentication verified');

// Test 2: Check Driver User Object
console.log('\n2️⃣ Checking Driver User Object...');
const driverUser = authState.user;
console.log('Driver User:', driverUser);

const requiredFields = ['id', 'email'];
const missingFields = requiredFields.filter(field => !driverUser[field]);

if (missingFields.length > 0) {
  console.log('❌ Missing required fields:', missingFields);
} else {
  console.log('✅ Driver user object has required fields');
}

// Test 3: Check Local Storage
console.log('\n3️⃣ Checking Local Storage...');
const storageKeys = [
  'tms_driver_user',
  'tms_driver_session', 
  'tms_driver_data',
  'tms_access_token',
  'tms_refresh_token'
];

const storageData = {};
storageKeys.forEach(key => {
  const value = localStorage.getItem(key);
  storageData[key] = value ? (key.includes('token') ? `${value.substring(0, 20)}...` : 'Present') : 'Missing';
});

console.log('Local Storage:', storageData);

const missingStorage = storageKeys.filter(key => storageData[key] === 'Missing');
if (missingStorage.length > 0) {
  console.log('❌ Missing storage keys:', missingStorage);
} else {
  console.log('✅ All driver storage keys present');
}

// Test 4: Test Driver Routes API
console.log('\n4️⃣ Testing Driver Routes API...');
async function testDriverRoutes() {
  try {
    const driverId = driverUser.id;
    console.log('Testing routes for driver ID:', driverId);
    
    const response = await fetch(`/api/driver/routes?driverId=${encodeURIComponent(driverId)}`);
    const data = await response.json();
    
    console.log('Routes API Response:', {
      status: response.status,
      success: data.success,
      routesCount: data.routes?.length || 0,
      routes: data.routes || []
    });
    
    if (response.ok && data.success) {
      console.log('✅ Driver routes API working');
      if (data.routes && data.routes.length > 0) {
        console.log('📋 Assigned routes:', data.routes.map(r => ({
          id: r.id,
          route_number: r.route_number,
          route_name: r.route_name,
          status: r.status
        })));
      } else {
        console.log('ℹ️ No routes assigned to this driver');
      }
    } else {
      console.log('❌ Driver routes API failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Driver routes API error:', error);
  }
}

// Test 5: Test Driver Profile API
console.log('\n5️⃣ Testing Driver Profile API...');
async function testDriverProfile() {
  try {
    const response = await fetch('/api/driver/profile');
    const data = await response.json();
    
    console.log('Profile API Response:', {
      status: response.status,
      success: data.success,
      driver: data.driver || null
    });
    
    if (response.ok && data.success) {
      console.log('✅ Driver profile API working');
      console.log('👤 Driver profile:', data.driver);
    } else {
      console.log('❌ Driver profile API failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Driver profile API error:', error);
  }
}

// Test 6: Check Driver Helpers
console.log('\n6️⃣ Testing Driver Helpers...');
async function testDriverHelpers() {
  try {
    const driverId = driverUser.id;
    
    // Test getAssignedRoutes
    console.log('Testing driverHelpers.getAssignedRoutes...');
    const routes = await window.driverHelpers?.getAssignedRoutes(driverId);
    console.log('Routes from helpers:', routes);
    
    if (routes && Array.isArray(routes)) {
      console.log('✅ Driver helpers working');
    } else {
      console.log('❌ Driver helpers not working properly');
    }
  } catch (error) {
    console.log('❌ Driver helpers error:', error);
  }
}

// Test 7: Check Session Manager
console.log('\n7️⃣ Checking Session Manager...');
const sessionManager = window.sessionManager;
if (sessionManager) {
  const session = sessionManager.getSession();
  console.log('Session Manager Session:', session);
  
  if (session && session.user) {
    console.log('✅ Session manager has valid session');
  } else {
    console.log('❌ Session manager has no valid session');
  }
} else {
  console.log('❌ Session manager not available');
}

// Run all tests
async function runAllTests() {
  await testDriverRoutes();
  await testDriverProfile();
  await testDriverHelpers();
  
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`Authentication: ${authState.isAuthenticated ? '✅' : '❌'}`);
  console.log(`User Type: ${authState.userType === 'driver' ? '✅' : '❌'}`);
  console.log(`User Object: ${driverUser ? '✅' : '❌'}`);
  console.log(`Storage Keys: ${missingStorage.length === 0 ? '✅' : '❌'}`);
  
  if (authState.isAuthenticated && authState.userType === 'driver' && driverUser && missingStorage.length === 0) {
    console.log('\n🎉 Driver data fetching appears to be working correctly!');
    console.log('You can now navigate to /driver to see the dashboard.');
  } else {
    console.log('\n⚠️ Some issues detected with driver data fetching.');
    console.log('Please check the errors above and ensure proper driver authentication.');
  }
}

// Execute tests
runAllTests();

// Export for manual testing
window.testDriverDataFetching = {
  authState,
  storageData,
  testDriverRoutes,
  testDriverProfile,
  testDriverHelpers,
  runAllTests
};
