import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    
    return NextResponse.json({
      keyId: keyId ? `${keyId.substring(0, 10)}...` : 'Missing',
      keySecret: keySecret ? `${keySecret.substring(0, 5)}...` : 'Missing',
      publicKeyId: publicKeyId ? `${publicKeyId.substring(0, 10)}...` : 'Missing',
      keyIdLength: keyId ? keyId.length : 0,
      keySecretLength: keySecret ? keySecret.length : 0,
      env: process.env.NODE_ENV
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 