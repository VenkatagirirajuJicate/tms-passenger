import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Missing Razorpay keys' }, { status: 400 });
    }
    
    // Test with Razorpay API directly
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      keysValid: response.status === 200,
      response: data,
      debug: {
        keyIdPrefix: keyId.substring(0, 10),
        keyIdLength: keyId.length,
        keySecretLength: keySecret.length
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
} 