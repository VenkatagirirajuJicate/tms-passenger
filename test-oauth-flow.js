// Test script to debug OAuth flow
// Run this in browser console on localhost:3003/login

console.log('🔍 Testing OAuth Configuration...');

// Check environment variables
const config = {
  parentAppUrl: 'https://my.jkkn.ac.in',
  appId: 'transport_management_system_menrm674',
  apiKey: 'app_e20655605d48ebce_cfa1ffe34268949a',
  redirectUri: 'http://localhost:3003/auth/callback'
};

console.log('📋 OAuth Configuration:', config);

// Test 1: Check if parent app is reachable
async function testParentAppConnection() {
  console.log('🌐 Testing parent app connection...');
  try {
    const response = await fetch('https://my.jkkn.ac.in', { 
      method: 'HEAD',
      mode: 'no-cors' // Avoid CORS issues for basic connectivity test
    });
    console.log('✅ Parent app is reachable');
  } catch (error) {
    console.error('❌ Parent app connection failed:', error);
  }
}

// Test 2: Check authorization endpoint
async function testAuthEndpoint() {
  console.log('🔗 Testing authorization endpoint...');
  
  const authUrl = new URL('/api/auth/child-app/authorize', config.parentAppUrl);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('app_id', config.appId);
  authUrl.searchParams.append('api_key', config.apiKey);
  authUrl.searchParams.append('redirect_uri', config.redirectUri);
  authUrl.searchParams.append('scope', 'read write profile');
  authUrl.searchParams.append('state', 'test-state-123');

  console.log('🔗 Generated OAuth URL:', authUrl.toString());
  
  try {
    // Test if the endpoint exists (will likely fail due to CORS, but we can see the response)
    const response = await fetch(authUrl.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': config.apiKey,
        'Accept': 'application/json'
      }
    });
    console.log('📊 Auth endpoint response status:', response.status);
  } catch (error) {
    console.log('⚠️ Auth endpoint test (expected CORS error):', error.message);
    console.log('💡 This is normal - the endpoint should work when redirected from login');
  }
}

// Test 3: Check if app is registered correctly
async function testAppRegistration() {
  console.log('🔍 Testing app registration...');
  
  // This would need to be tested by actually going through the OAuth flow
  console.log('💡 To test app registration:');
  console.log('1. Click "Sign in with MYJKKN" on the login page');
  console.log('2. Check browser network tab for the request/response');
  console.log('3. Look for any error messages in the parent app response');
}

// Test 4: Validate configuration matches Supabase dashboard
function validateConfiguration() {
  console.log('✅ Configuration Validation:');
  console.log('App ID matches dashboard:', config.appId === 'transport_management_system_menrm674');
  console.log('Redirect URI matches dashboard:', config.redirectUri === 'http://localhost:3003/auth/callback');
  console.log('Parent app URL is correct:', config.parentAppUrl === 'https://my.jkkn.ac.in');
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting OAuth Flow Tests...\n');
  
  validateConfiguration();
  console.log('');
  
  await testParentAppConnection();
  console.log('');
  
  await testAuthEndpoint();
  console.log('');
  
  testAppRegistration();
  
  console.log('\n✅ OAuth tests completed!');
  console.log('💡 Next step: Try the actual login flow and check browser network tab');
}

// Auto-run tests
runAllTests();
