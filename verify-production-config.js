// Production Configuration Verification Script
// Run this in the browser console on https://tms-passenger.vercel.app/

console.log('🔍 TMS Passenger Production Configuration Check');
console.log('==============================================');

// Check environment variables
const config = {
  parentAppUrl: process.env.NEXT_PUBLIC_PARENT_APP_URL,
  appId: process.env.NEXT_PUBLIC_APP_ID,
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI,
  driverRedirectUri: process.env.NEXT_PUBLIC_DRIVER_REDIRECT_URI,
  authDebug: process.env.NEXT_PUBLIC_AUTH_DEBUG,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  currentUrl: window.location.origin
};

console.log('📋 Current Configuration:', config);

// Verify redirect URIs are production URLs
const isProductionRedirect = config.redirectUri?.includes('tms-passenger.vercel.app');
const isProductionDriverRedirect = config.driverRedirectUri?.includes('tms-passenger.vercel.app');

console.log('✅ Redirect URI Check:', {
  passenger: isProductionRedirect ? '✅ Production' : '❌ Development',
  driver: isProductionDriverRedirect ? '✅ Production' : '❌ Development',
  passengerUrl: config.redirectUri,
  driverUrl: config.driverRedirectUri
});

// Test OAuth URL generation
const testOAuthUrl = new URL('/api/auth/child-app/authorize', config.parentAppUrl);
testOAuthUrl.searchParams.append('response_type', 'code');
testOAuthUrl.searchParams.append('app_id', config.appId);
testOAuthUrl.searchParams.append('api_key', config.apiKey);
testOAuthUrl.searchParams.append('redirect_uri', config.redirectUri);
testOAuthUrl.searchParams.append('scope', 'read write profile');
testOAuthUrl.searchParams.append('state', 'test_production_' + Date.now());

console.log('🔗 Test OAuth URL:', testOAuthUrl.toString());

// Check if we're on the correct domain
const isCorrectDomain = window.location.hostname === 'tms-passenger.vercel.app';
console.log('🌐 Domain Check:', isCorrectDomain ? '✅ Correct domain' : '❌ Wrong domain');

// Summary
console.log('\n📊 Summary:');
console.log('===========');
console.log(`Environment: ${isCorrectDomain ? 'Production' : 'Development'}`);
console.log(`Parent App: ${config.parentAppUrl}`);
console.log(`App ID: ${config.appId}`);
console.log(`Passenger Callback: ${isProductionRedirect ? '✅' : '❌'} ${config.redirectUri}`);
console.log(`Driver Callback: ${isProductionDriverRedirect ? '✅' : '❌'} ${config.driverRedirectUri}`);

if (isProductionRedirect && isProductionDriverRedirect && isCorrectDomain) {
  console.log('\n🎉 Production configuration looks correct!');
  console.log('You can now test the authentication flow.');
} else {
  console.log('\n⚠️  Configuration issues detected. Please check:');
  if (!isProductionRedirect) console.log('- Passenger redirect URI is not production URL');
  if (!isProductionDriverRedirect) console.log('- Driver redirect URI is not production URL');
  if (!isCorrectDomain) console.log('- Not running on production domain');
}

// Export for use in other scripts
window.tmsProductionConfig = config;

