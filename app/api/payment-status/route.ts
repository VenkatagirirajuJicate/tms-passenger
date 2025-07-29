import { NextRequest, NextResponse } from 'next/server';
import { studentHelpers } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ 
        error: 'Student ID is required' 
      }, { status: 400 });
    }

    // Get payment status
    const paymentStatus = await studentHelpers.getPaymentStatus(studentId);

    // Get available fees if account is inactive
    let availableFees = null;
    if (!paymentStatus.isActive) {
      try {
        availableFees = await studentHelpers.getAvailableFees(studentId);
      } catch (error) {
        console.error('Error fetching available fees:', error);
      }
    }

    // Get next due amount
    const nextDueAmount = availableFees?.available_options?.find((option: any) => 
      option.is_available && option.is_recommended
    )?.amount;

    return NextResponse.json({
      success: true,
      isActive: paymentStatus.isActive,
      lastPaidTerm: paymentStatus.lastPaidTerm,
      message: paymentStatus.message,
      nextDueAmount,
      availableFees: availableFees?.available_options?.filter((option: any) => option.is_available) || []
    });

  } catch (error: any) {
    console.error('Error checking payment status:', error);
    return NextResponse.json({ 
      error: 'Failed to check payment status',
      details: error.message 
    }, { status: 500 });
  }
} 