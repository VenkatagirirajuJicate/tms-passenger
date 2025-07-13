import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Demo payment flow test');
    
    // Simulate demo payment processing
    const isDemo = process.env.DEMO_MODE === 'true';
    
    if (isDemo) {
      // Create mock payment data
      const mockPayment = {
        success: true,
        order: {
          id: `order_demo_${Date.now()}`,
          amount: 1000000, // ₹10,000 in paisa
          currency: 'INR',
          receipt: `TMS_${Date.now()}_demo`,
          status: 'created'
        },
        isDemo: true,
        paymentConfig: {
          key: 'demo_key',
          amount: 1000000,
          currency: 'INR',
          name: 'JKKN College of Engineering',
          description: 'Transport Fee - 2025-26 Semester 1',
          order_id: `order_demo_${Date.now()}`,
          receipt: `TMS_${Date.now()}_demo`,
          prefill: {
            name: 'Demo Student',
            email: 'demo@student.edu',
            contact: '9876543210'
          },
          theme: {
            color: '#2196F3'
          }
        },
        studentData: {
          studentName: 'Demo Student',
          studentEmail: 'demo@student.edu',
          studentMobile: '9876543210',
          routeName: 'DEMO ROUTE - College to City',
          routeNumber: 'RT001',
          stopName: 'City Center Stop',
          academicYear: '2025-26',
          semester: '1',
          amount: 10000
        },
        paymentId: `demo_payment_${Date.now()}`
      };

      return NextResponse.json(mockPayment);
    } else {
      return NextResponse.json({ 
        error: 'Demo mode not enabled' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in test payment flow:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test Payment Flow API',
    demoMode: process.env.DEMO_MODE === 'true',
    status: 'ready'
  });
} 