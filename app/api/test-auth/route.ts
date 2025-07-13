import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userEmail = request.headers.get('X-User-Email');
    const studentId = request.headers.get('X-Student-Id');
    
    return NextResponse.json({
      success: true,
      userEmail,
      studentId,
      hasEmail: !!userEmail,
      hasStudentId: !!studentId,
      message: 'Authentication headers received'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Test API failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 