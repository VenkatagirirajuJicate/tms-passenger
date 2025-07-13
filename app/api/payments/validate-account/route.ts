import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { keyId, keySecret } = await request.json();
    
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Missing keys' }, { status: 400 });
    }
    
    // Test with Razorpay API
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    
    // Try to create a minimal test order
    const testOrder = {
      amount: 100, // ₹1.00 in paisa
      currency: 'INR',
      receipt: `test_${Date.now()}`
    };
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testOrder)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Keys are valid! Account is working.',
        keyFormat: {
          keyId: keyId.substring(0, 10) + '...',
          keyIdLength: keyId.length,
          keySecretLength: keySecret.length,
          isTest: keyId.includes('test')
        },
        testOrder: {
          id: data.id,
          amount: data.amount,
          currency: data.currency,
          status: data.status
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: data.error?.description || 'Invalid keys',
        details: data,
        keyFormat: {
          keyId: keyId.substring(0, 10) + '...',
          keyIdLength: keyId.length,
          keySecretLength: keySecret.length,
          isTest: keyId.includes('test')
        }
      });
    }
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: 'Network or server error'
    }, { status: 500 });
  }
} 