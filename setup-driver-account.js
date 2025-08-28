// Quick setup script to create a driver account
// Run this in Node.js or browser console

const createDriverAccount = async () => {
  const driverData = {
    name: 'Arthanareswaran',
    email: 'arthanareswaran22@jkkn.ac.in',
    phone: '9876543210',
    licenseNumber: 'DL123456789',
    password: 'your_password_here', // Replace with actual password
    adminKey: 'admin_setup_key' // Replace with actual admin key
  };

  try {
    console.log('🚗 Creating driver account...');
    
    const response = await fetch('http://localhost:3003/api/admin/create-driver', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(driverData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Driver account created successfully!');
      console.log('Driver details:', result.driver);
      console.log('🎉 You can now login at: http://localhost:3003/driver-login');
    } else {
      console.error('❌ Failed to create driver account:', result.error);
      
      if (result.error.includes('already exists')) {
        console.log('💡 Driver account already exists. Try logging in directly.');
      }
    }
  } catch (error) {
    console.error('❌ Error creating driver account:', error);
  }
};

// Check if driver account exists first
const checkDriverAccount = async () => {
  try {
    console.log('🔍 Checking if driver account exists...');
    
    const response = await fetch('http://localhost:3003/api/check-driver', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'arthanareswaran22@jkkn.ac.in'
      })
    });

    const result = await response.json();
    
    console.log('📋 Driver account status:', result.message);
    
    if (result.exists) {
      if (result.hasPassword && result.isActive) {
        console.log('✅ Driver account is ready for login!');
        console.log('🚀 Go to: http://localhost:3003/driver-login');
      } else {
        console.log('⚠️ Driver account needs setup:', result.message);
      }
    } else {
      console.log('❌ Driver account not found. Creating...');
      await createDriverAccount();
    }
  } catch (error) {
    console.error('❌ Error checking driver account:', error);
  }
};

// Run the check
checkDriverAccount();

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createDriverAccount, checkDriverAccount };
}
