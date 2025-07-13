import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    const config = {
      hasKeyId: !!keyId,
      hasKeySecret: !!keySecret,
      hasPublicKeyId: !!publicKeyId,
      keyIdFormat: keyId ? (keyId.startsWith('rzp_') ? 'Valid' : 'Invalid format') : 'Missing',
      keyIdLength: keyId ? keyId.length : 0,
      keySecretLength: keySecret ? keySecret.length : 0,
      isPlaceholder: keyId === 'your_razorpay_key_id' || keyId === 'rzp_test_your_key_id_here',
      isTestMode: keyId ? keyId.includes('test') : false,
      isProduction: keyId ? keyId.includes('live') : false,
      environment: process.env.NODE_ENV || 'development'
    };

    // Check if configuration is valid
    const isConfigValid = config.hasKeyId && 
                         config.hasKeySecret && 
                         config.hasPublicKeyId && 
                         !config.isPlaceholder &&
                         config.keyIdFormat === 'Valid';

    const recommendations = [];
    
    if (!config.hasKeyId) {
      recommendations.push('Add RAZORPAY_KEY_ID to your environment variables');
    }
    
    if (!config.hasKeySecret) {
      recommendations.push('Add RAZORPAY_KEY_SECRET to your environment variables');
    }
    
    if (!config.hasPublicKeyId) {
      recommendations.push('Add NEXT_PUBLIC_RAZORPAY_KEY_ID to your environment variables');
    }
    
    if (config.isPlaceholder) {
      recommendations.push('Replace placeholder API keys with actual keys from Razorpay Dashboard');
    }
    
    if (config.keyIdFormat === 'Invalid format') {
      recommendations.push('Key ID should start with "rzp_test_" (test) or "rzp_live_" (production)');
    }

    if (isConfigValid && config.isTestMode) {
      recommendations.push('✅ Configuration looks good! You can start testing payments.');
    }

    return NextResponse.json({
      status: isConfigValid ? 'valid' : 'invalid',
      config,
      recommendations,
      setupGuide: 'See QUICK_RAZORPAY_SETUP.md for detailed instructions'
    }, { status: 200 });

  } catch (error) {
    console.error('Error checking Razorpay config:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      status: 'error',
      error: errorMessage,
      setupGuide: 'See QUICK_RAZORPAY_SETUP.md for setup instructions'
    }, { status: 500 });
  }
} 