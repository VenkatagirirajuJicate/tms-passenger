// Test Interval Fix
// Run this in the browser console to test the improved interval functionality

console.log('🧪 Testing Interval Fix...');

let testInterval = null;
let testCount = 0;
let lastUpdateTime = 0;

// Test function to simulate location updates
function testLocationUpdate() {
  const now = Date.now();
  const timeSinceLastUpdate = now - lastUpdateTime;
  
  console.log(`📍 Test update ${++testCount} at ${new Date(now).toISOString()}`);
  console.log(`⏱️ Time since last update: ${timeSinceLastUpdate}ms`);
  
  // Simulate API call delay
  setTimeout(() => {
    console.log(`✅ Update ${testCount} completed successfully`);
    lastUpdateTime = now;
    
    // Update next update time
    const nextUpdate = new Date(now + 30000);
    console.log(`🔄 Next update scheduled for: ${nextUpdate.toISOString()}`);
    
    // Update countdown
    updateCountdown(nextUpdate);
  }, 1000);
}

// Countdown function
function updateCountdown(nextUpdateTime) {
  const countdownInterval = setInterval(() => {
    const now = new Date();
    const diff = nextUpdateTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      console.log('⏰ Countdown reached zero - triggering update');
      clearInterval(countdownInterval);
      testLocationUpdate();
    } else {
      const seconds = Math.ceil(diff / 1000);
      console.log(`⏳ Countdown: ${seconds}s remaining`);
    }
  }, 1000);
}

// Start test
function startIntervalTest() {
  console.log('🚀 Starting interval test...');
  testCount = 0;
  lastUpdateTime = 0;
  
  // Initial update
  testLocationUpdate();
  
  // Set up interval
  testInterval = setInterval(() => {
    testLocationUpdate();
  }, 30000);
  
  console.log('✅ Interval test started - monitoring for 2 minutes');
  
  // Stop after 2 minutes
  setTimeout(() => {
    if (testInterval) {
      clearInterval(testInterval);
      console.log('🛑 Interval test completed');
      console.log(`📊 Total updates: ${testCount}`);
    }
  }, 120000);
}

// Stop test
function stopIntervalTest() {
  if (testInterval) {
    clearInterval(testInterval);
    testInterval = null;
    console.log('🛑 Interval test stopped');
  }
}

// Export functions
window.intervalTest = {
  start: startIntervalTest,
  stop: stopIntervalTest
};

console.log('💡 Run intervalTest.start() to test the interval functionality');
console.log('💡 Run intervalTest.stop() to stop the test');


