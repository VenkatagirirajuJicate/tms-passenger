import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

// GET - Fetch payment options and history for 3-term system
export async function GET(request: NextRequest) {
  try {
    console.log('Enhanced semester payments API called');
    
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const type = searchParams.get('type'); // 'available', 'history', 'fee-structure'

    console.log('Parameters - studentId:', studentId, 'type:', type);

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    switch (type) {
      case 'available':
        return await fetchAvailablePaymentOptions(studentId);
      case 'history':
        return await fetchPaymentHistory(studentId);
      case 'fee-structure':
        return await fetchFeeStructure(studentId);
      default:
        return NextResponse.json({ 
          error: 'Invalid type parameter. Use "available", "history", or "fee-structure"' 
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in enhanced semester payments GET:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// Helper function to determine current academic year and term
function getCurrentAcademicInfo() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  let academicYear: string;
  let currentTerm: string;
  
  if (month >= 6) {
    // June onwards - new academic year starts  
    academicYear = `${year}-${String(year + 1).slice(-2)}`;
  } else {
    // Jan-May - still in previous academic year
    academicYear = `${year - 1}-${String(year).slice(-2)}`;
  }
  
  // Determine current term based on month
  if (month >= 6 && month <= 9) {
    currentTerm = '1'; // June-September
  } else if (month >= 10 || month <= 1) {
    currentTerm = '2'; // October-January
  } else {
    currentTerm = '3'; // February-May
  }
  
  return { academicYear, currentTerm };
}

// Fetch available payment options (terms + full year)
async function fetchAvailablePaymentOptions(studentId: string) {
  try {
    console.log('Fetching available payment options for student:', studentId);
    
    const { academicYear, currentTerm } = getCurrentAcademicInfo();
    
    // Get student's route and boarding information
    const { data: studentInfo, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        allocated_route_id,
        boarding_point,
        boarding_stop
      `)
      .eq('id', studentId)
      .single();

    if (studentError || !studentInfo) {
      console.error('Error fetching student info:', studentError);
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const routeId = studentInfo.allocated_route_id;
    const boardingStop = studentInfo.boarding_point || studentInfo.boarding_stop;

    if (!routeId || !boardingStop) {
      return NextResponse.json({ 
        error: 'Student route or boarding stop not configured' 
      }, { status: 400 });
    }

    // Get fee structure directly from semester_fees table
    const { data: feeData, error: feeError } = await supabase
      .from('semester_fees')
      .select(`
        semester,
        semester_fee,
        full_year_discount_percent
      `)
      .eq('allocated_route_id', routeId)
      .eq('stop_name', boardingStop)
      .eq('academic_year', academicYear)
      .eq('is_active', true);

    if (feeError) {
      console.error('Error fetching fee structure:', feeError);
      return NextResponse.json({ error: 'Failed to fetch fee structure' }, { status: 500 });
    }

    if (!feeData || feeData.length === 0) {
      return NextResponse.json({ error: 'Fee structure not found for this route and stop' }, { status: 404 });
    }

    // Process the fees into our expected structure
    const term1Fee = feeData.find(f => f.semester === '1')?.semester_fee || 0;
    const term2Fee = feeData.find(f => f.semester === '2')?.semester_fee || 0;
    const term3Fee = feeData.find(f => f.semester === '3')?.semester_fee || 0;
    const discountPercent = feeData[0]?.full_year_discount_percent || 5;
    
    const totalTermFees = term1Fee + term2Fee + term3Fee;
    const fullYearFee = Math.round(totalTermFees * (1 - discountPercent / 100));

    const fees = {
      term_1_fee: term1Fee,
      term_2_fee: term2Fee,
      term_3_fee: term3Fee,
      full_year_discount_percent: discountPercent,
      total_term_fees: totalTermFees,
      full_year_fee: fullYearFee
    };

    // Check existing payments to determine what's available
    const { data: existingPayments, error: paymentsError } = await supabase
      .from('semester_payments')
      .select(`
        id,
        semester,
        payment_type,
        covers_terms,
        payment_status,
        amount_paid
      `)
      .eq('student_id', studentId)
      .eq('allocated_route_id', routeId)
      .eq('academic_year', academicYear)
      .in('payment_status', ['confirmed', 'pending']);

    if (paymentsError) {
      console.error('Error fetching existing payments:', paymentsError);
    }

    const paidTerms = new Set<string>();
    const pendingTerms = new Set<string>();
    const confirmedTerms = new Set<string>();
    let hasFullYearPayment = false;
    let fullYearPaymentStatus = '';

    // Process existing payments (both confirmed and pending should block new payments)
    if (existingPayments) {
      existingPayments.forEach(payment => {
        if (payment.payment_type === 'full_year' && ['confirmed', 'pending'].includes(payment.payment_status)) {
          hasFullYearPayment = true;
          fullYearPaymentStatus = payment.payment_status;
          // Full year covers all terms
          paidTerms.add('1');
          paidTerms.add('2');
          paidTerms.add('3');
          if (payment.payment_status === 'pending') {
            pendingTerms.add('1');
            pendingTerms.add('2');
            pendingTerms.add('3');
          } else {
            confirmedTerms.add('1');
            confirmedTerms.add('2');
            confirmedTerms.add('3');
          }
        } else if (payment.payment_type === 'term' && ['confirmed', 'pending'].includes(payment.payment_status)) {
          const termsToAdd = payment.covers_terms && payment.covers_terms.length > 0 
            ? payment.covers_terms 
            : [payment.semester];
          
          termsToAdd.forEach(term => {
            paidTerms.add(term);
            if (payment.payment_status === 'pending') {
              pendingTerms.add(term);
            } else {
              confirmedTerms.add(term);
            }
          });
        }
      });
    }

    // Build payment options (including paid terms with status)
    const availableOptions = [];
    const termStatuses: Record<string, any> = {};

    // Individual term options (show all terms with their status)
    ['1', '2', '3'].forEach((term: string) => {
      const termFee = term === '1' ? fees.term_1_fee : 
                     term === '2' ? fees.term_2_fee : fees.term_3_fee;
      
      const isPaid = hasFullYearPayment || paidTerms.has(term);
      const isAvailable = !isPaid && !hasFullYearPayment && termFee > 0;
      
      if (termFee > 0) {
        const termOption = {
          payment_type: 'term',
          term: term,
          amount: termFee,
          description: `Term ${term} Payment`,
          period: getTermDescription(term, academicYear),
          covers_terms: [term],
          receipt_color: getReceiptColorForTerm(term),
          is_recommended: term === currentTerm && isAvailable,
          is_paid: isPaid,
          is_available: isAvailable,
          paid_reason: isPaid ? (
            hasFullYearPayment 
              ? `Covered by Full Year Payment (${fullYearPaymentStatus === 'pending' ? 'Payment Pending' : 'Paid'})`
              : pendingTerms.has(term) 
                ? 'Payment Pending' 
                : 'Already Paid'
          ) : null
        };

        // Store term status for summary
        termStatuses[term] = {
          is_paid: isPaid,
          amount: termFee,
          paid_reason: termOption.paid_reason
        };

        // Add to options regardless of payment status (UI will handle display)
        availableOptions.push(termOption);
      }
    });

    // Full year option with status
    if (fees.full_year_fee > 0) {
      const savings = fees.total_term_fees - fees.full_year_fee;
      const isFullYearAvailable = !hasFullYearPayment && paidTerms.size === 0;
      
      availableOptions.push({
        payment_type: 'full_year',
        term: 'full_year',
        amount: fees.full_year_fee,
        description: 'Full Academic Year Payment',
        period: getFullYearPeriod(academicYear),
        covers_terms: ['1', '2', '3'],
        receipt_color: 'green',
        savings: savings,
        discount_percent: fees.full_year_discount_percent,
        is_recommended: isFullYearAvailable,
        is_paid: hasFullYearPayment,
        is_available: isFullYearAvailable,
        paid_reason: hasFullYearPayment 
          ? (fullYearPaymentStatus === 'pending' ? 'Full Year Payment Pending' : 'Already Paid')
          : (paidTerms.size > 0 
            ? (pendingTerms.size > 0 
              ? 'Individual term payments already initiated' 
              : 'Individual term payments already made')
            : null)
      });
    }

    // Get route details for display
    const { data: routeInfo, error: routeError } = await supabase
      .from('routes')
      .select('id, route_number, route_name, start_location, end_location')
      .eq('id', routeId)
      .single();

    return NextResponse.json({
      student_id: studentId,
      academic_year: academicYear,
      current_term: currentTerm,
      route: routeInfo || null,
      boarding_stop: boardingStop,
      fee_structure: fees,
      paid_terms: Array.from(paidTerms),
      has_full_year_payment: hasFullYearPayment,
      term_statuses: termStatuses,
      available_options: availableOptions
    });

  } catch (error) {
    console.error('Error fetching available payment options:', error);
    return NextResponse.json({ error: 'Failed to fetch payment options' }, { status: 500 });
  }
}

// Fetch enhanced payment history
async function fetchPaymentHistory(studentId: string) {
  try {
    const { data: paymentHistory, error: historyError } = await supabase
      .from('semester_payments')
      .select(`
        id,
        student_id,
        allocated_route_id,
        stop_name,
        academic_year,
        semester,
        payment_type,
        covers_terms,
        amount_paid,
        payment_date,
        payment_method,
        payment_status,
        valid_from,
        valid_until,
        receipt_number,
        created_at
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('Error fetching payment history:', historyError);
      return NextResponse.json({ error: 'Failed to fetch payment history' }, { status: 500 });
    }

    // Get route information for payments
    const routeIds = [...new Set(paymentHistory?.map(p => p.allocated_route_id).filter(Boolean) || [])];
    
    let routeInfo = [];
    if (routeIds.length > 0) {
      const { data: routes } = await supabase
        .from('routes')
        .select('id, route_number, route_name')
        .in('id', routeIds);
      
      routeInfo = routes || [];
    }

    // Get receipt information
    const paymentIds = paymentHistory?.map(p => p.id).filter(Boolean) || [];
    let receipts = [];
    
    if (paymentIds.length > 0) {
      const { data: receiptData } = await supabase
        .from('payment_receipts')
        .select(`
          semester_payment_id,
          receipt_number,
          receipt_color,
          receipt_date
        `)
        .in('semester_payment_id', paymentIds);
      
      receipts = receiptData || [];
    }

    // Combine data
    const enhancedHistory = (paymentHistory || []).map(payment => {
      const route = routeInfo.find(r => r.id === payment.allocated_route_id);
      const receipt = receipts.find(r => r.semester_payment_id === payment.id);
      
      return {
        ...payment,
        route: route || null,
        receipt: receipt || null,
        display_description: getPaymentDescription(payment),
        period_covered: getPeriodCovered(payment.covers_terms || [payment.semester])
      };
    });

    return NextResponse.json(enhancedHistory);

  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json({ error: 'Failed to fetch payment history' }, { status: 500 });
  }
}

// Fetch complete fee structure
async function fetchFeeStructure(studentId: string) {
  try {
    const { academicYear } = getCurrentAcademicInfo();
    
    // Get student's route info
    const { data: studentInfo, error: studentError } = await supabase
      .from('students')
      .select('allocated_route_id, boarding_point, boarding_stop')
      .eq('id', studentId)
      .single();

    if (studentError || !studentInfo) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const routeId = studentInfo.allocated_route_id;
    const boardingStop = studentInfo.boarding_point || studentInfo.boarding_stop;

    if (!routeId || !boardingStop) {
      return NextResponse.json({ error: 'Route or boarding stop not configured' }, { status: 400 });
    }

    // Get complete fee structure directly from semester_fees table
    const { data: feeData, error: feeError } = await supabase
      .from('semester_fees')
      .select(`
        semester,
        semester_fee,
        full_year_discount_percent
      `)
      .eq('allocated_route_id', routeId)
      .eq('stop_name', boardingStop)
      .eq('academic_year', academicYear)
      .eq('is_active', true);

    if (feeError) {
      console.error('Error fetching fee structure:', feeError);
      return NextResponse.json({ error: 'Failed to fetch fee structure' }, { status: 500 });
    }

    if (!feeData || feeData.length === 0) {
      return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 });
    }

    // Process the fees into our expected structure  
    const term1Fee = feeData.find(f => f.semester === '1')?.semester_fee || 0;
    const term2Fee = feeData.find(f => f.semester === '2')?.semester_fee || 0;
    const term3Fee = feeData.find(f => f.semester === '3')?.semester_fee || 0;
    const discountPercent = feeData[0]?.full_year_discount_percent || 5;
    
    const totalTermFees = term1Fee + term2Fee + term3Fee;
    const fullYearFee = Math.round(totalTermFees * (1 - discountPercent / 100));

    const fees = {
      term_1_fee: term1Fee,
      term_2_fee: term2Fee,
      term_3_fee: term3Fee,
      full_year_discount_percent: discountPercent,
      total_term_fees: totalTermFees,
      full_year_fee: fullYearFee
    };
    
    return NextResponse.json({
      academic_year: academicYear,
      route_id: routeId,
      boarding_stop: boardingStop,
      term_structure: {
        term_1: {
          period: getTermDescription('1', academicYear),
          amount: fees.term_1_fee,
          receipt_color: 'white'
        },
        term_2: {
          period: getTermDescription('2', academicYear), 
          amount: fees.term_2_fee,
          receipt_color: 'blue'
        },
        term_3: {
          period: getTermDescription('3', academicYear),
          amount: fees.term_3_fee,
          receipt_color: 'yellow'
        }
      },
      full_year: {
        amount: fees.full_year_fee,
        savings: fees.total_term_fees - fees.full_year_fee,
        discount_percent: fees.full_year_discount_percent,
        receipt_color: 'green'
      },
      total_if_paid_separately: fees.total_term_fees
    });

  } catch (error) {
    console.error('Error fetching fee structure:', error);
    return NextResponse.json({ error: 'Failed to fetch fee structure' }, { status: 500 });
  }
}

// POST - Create payment (enhanced for 3-term system)
export async function POST(request: NextRequest) {
  try {
    const { 
      studentId, 
      paymentType, // 'term' or 'full_year'
      termNumber, // '1', '2', '3' for individual terms
      routeId,
      stopName,
      paymentMethod = 'upi'
    } = await request.json();

    if (!studentId || !paymentType || !routeId || !stopName) {
      return NextResponse.json({ 
        error: 'Student ID, payment type, route ID, and stop name are required' 
      }, { status: 400 });
    }

    if (paymentType === 'term' && !termNumber) {
      return NextResponse.json({ 
        error: 'Term number is required for term payments' 
      }, { status: 400 });
    }

    const { academicYear } = getCurrentAcademicInfo();

    // Check for existing payments
    const { data: existingPayments, error: existingError } = await supabase
      .from('semester_payments')
      .select('id, payment_type, covers_terms, payment_status')
      .eq('student_id', studentId)
      .eq('allocated_route_id', routeId)
      .eq('academic_year', academicYear)
      .in('payment_status', ['confirmed', 'pending']);

    if (existingError) {
      console.error('Error checking existing payments:', existingError);
      return NextResponse.json({ error: 'Failed to check existing payments' }, { status: 500 });
    }

    // Validate payment eligibility
    const validation = validatePaymentEligibility(existingPayments || [], paymentType, termNumber);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.reason }, { status: 409 });
    }

    // Get fee amount using direct table query
    const { data: feeData, error: feeError } = await supabase
      .from('semester_fees')
      .select(`
        id,
        semester,
        semester_fee,
        full_year_discount_percent
      `)
      .eq('allocated_route_id', routeId)
      .eq('stop_name', stopName)
      .eq('academic_year', academicYear)
      .eq('is_active', true);

    if (feeError) {
      console.error('Error fetching fee structure:', feeError);
      return NextResponse.json({ error: 'Failed to fetch fee structure' }, { status: 500 });
    }

    if (!feeData || feeData.length === 0) {
      return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 });
    }

    // Process the fees into our expected structure
    const term1Data = feeData.find(f => f.semester === '1');
    const term2Data = feeData.find(f => f.semester === '2');
    const term3Data = feeData.find(f => f.semester === '3');
    
    const term1Fee = term1Data?.semester_fee || 0;
    const term2Fee = term2Data?.semester_fee || 0;
    const term3Fee = term3Data?.semester_fee || 0;
    const discountPercent = feeData[0]?.full_year_discount_percent || 5;
    
    const totalTermFees = term1Fee + term2Fee + term3Fee;
    const fullYearFee = Math.round(totalTermFees * (1 - discountPercent / 100));

    const fees = {
      term_1_fee: term1Fee,
      term_2_fee: term2Fee,
      term_3_fee: term3Fee,
      full_year_fee: fullYearFee,
      term_1_id: term1Data?.id,
      term_2_id: term2Data?.id,
      term_3_id: term3Data?.id
    };

    let amount: number;
    let coversTerms: string[];
    let semester: string;
    let semesterFeeId: string | null = null;

    if (paymentType === 'full_year') {
      amount = fees.full_year_fee;
      coversTerms = ['1', '2', '3'];
      semester = '1'; // Use semester 1 as primary for full year
      semesterFeeId = fees.term_1_id; // Use term 1 fee ID as primary for full year
    } else {
      semester = termNumber;
      coversTerms = [termNumber];
      if (termNumber === '1') {
        amount = fees.term_1_fee;
        semesterFeeId = fees.term_1_id;
      } else if (termNumber === '2') {
        amount = fees.term_2_fee;
        semesterFeeId = fees.term_2_id;
      } else {
        amount = fees.term_3_fee;
        semesterFeeId = fees.term_3_id;
      }
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Invalid fee amount' }, { status: 400 });
    }

    // Calculate validity period
    const { validFrom, validUntil } = calculateValidityPeriod(coversTerms, academicYear);

    // Validate that we have the required semester_fee_id
    if (!semesterFeeId) {
      return NextResponse.json({ 
        error: `Fee record not found for term ${termNumber || 'full_year'}` 
      }, { status: 404 });
    }

    // Create payment record
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('semester_payments')
      .insert({
        student_id: studentId,
        semester_fee_id: semesterFeeId,
        allocated_route_id: routeId,
        stop_name: stopName,
        academic_year: academicYear,
        semester: semester,
        payment_type: paymentType,
        covers_terms: coversTerms,
        amount_paid: amount,
        payment_method: paymentMethod,
        payment_status: 'pending',
        valid_from: validFrom,
        valid_until: validUntil,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 });
    }

    return NextResponse.json({
      payment_id: paymentRecord.id,
      amount: amount,
      payment_type: paymentType,
      covers_terms: coversTerms,
      valid_from: validFrom,
      valid_until: validUntil,
      receipt_color: paymentType === 'full_year' ? 'green' : getReceiptColorForTerm(termNumber),
      message: 'Payment record created successfully'
    });

  } catch (error) {
    console.error('Error in payment creation:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}

// Helper functions
function getTermDescription(term: string, academicYear?: string): string {
  // Use the provided academic year or calculate current one
  const currentAcademic = academicYear || getCurrentAcademicInfo().academicYear;
  const [startYearStr, endYearStr] = currentAcademic.split('-');
  const startYear = parseInt(startYearStr);
  
  // Handle 2-digit year format (e.g., "25" -> 2025)
  let endYear: number;
  if (endYearStr.length === 2) {
    const currentCentury = Math.floor(startYear / 100) * 100;
    endYear = currentCentury + parseInt(endYearStr);
  } else {
    endYear = parseInt(endYearStr);
  }

  switch (term) {
    case '1': return `June - September ${startYear}`;
    case '2': return `October ${startYear} - January ${endYear}`;
    case '3': return `February - May ${endYear}`;
    default: return 'Unknown Term';
  }
}

function getFullYearPeriod(academicYear: string): string {
  const [startYearStr, endYearStr] = academicYear.split('-');
  const startYear = parseInt(startYearStr);
  
  // Handle 2-digit year format (e.g., "25" -> 2025)
  let endYear: number;
  if (endYearStr.length === 2) {
    const currentCentury = Math.floor(startYear / 100) * 100;
    endYear = currentCentury + parseInt(endYearStr);
  } else {
    endYear = parseInt(endYearStr);
  }
  
  return `June ${startYear} - May ${endYear}`;
}

function getReceiptColorForTerm(term: string): string {
  switch (term) {
    case '1': return 'white';
    case '2': return 'blue'; 
    case '3': return 'yellow';
    default: return 'white';
  }
}

function getPaymentDescription(payment: any): string {
  if (payment.payment_type === 'full_year') {
    return 'Full Academic Year Payment';
  } else {
    return `Term ${payment.semester} Payment`;
  }
}

function getPeriodCovered(terms: string[]): string {
  if (terms.length === 3) {
    return 'Full Academic Year';
  }
  return terms.map(term => `Term ${term}`).join(', ');
}

function validatePaymentEligibility(existingPayments: any[], paymentType: string, termNumber?: string) {
  // Check for full year payment
  const hasFullYear = existingPayments.some(p => 
    p.payment_type === 'full_year' && p.payment_status === 'confirmed'
  );

  if (hasFullYear) {
    return { isValid: false, reason: 'Full year payment already completed' };
  }

  if (paymentType === 'full_year') {
    // Check if any term payments exist
    const hasTermPayments = existingPayments.some(p => 
      p.payment_type === 'term' && p.payment_status === 'confirmed'
    );
    
    if (hasTermPayments) {
      return { isValid: false, reason: 'Cannot pay full year after individual term payments' };
    }
  } else if (paymentType === 'term' && termNumber) {
    // Check if this specific term is already paid
    const termPaid = existingPayments.some(p => 
      p.payment_status === 'confirmed' && 
      (p.covers_terms?.includes(termNumber) || p.semester === termNumber)
    );
    
    if (termPaid) {
      return { isValid: false, reason: `Term ${termNumber} payment already completed` };
    }
  }

  return { isValid: true, reason: '' };
}

function calculateValidityPeriod(coversTerms: string[], academicYear: string) {
  const [startYearStr, endYearStr] = academicYear.split('-');
  const startYear = parseInt(startYearStr);
  
  // Handle 2-digit year format (e.g., "2025-26" -> 2026)
  let endYear: number;
  if (endYearStr.length === 2) {
    // Convert 2-digit year to 4-digit (26 -> 2026)
    const currentCentury = Math.floor(startYear / 100) * 100;
    endYear = currentCentury + parseInt(endYearStr);
  } else {
    endYear = parseInt(endYearStr);
  }
  
  let validFrom: string;
  let validUntil: string;
  
  if (coversTerms.length === 3) {
    // Full year - valid throughout the entire academic year
    validFrom = `${startYear}-06-01`;
    validUntil = `${endYear}-05-31`;
  } else {
    // Individual terms - extend validity beyond term end for grace period
    const term = coversTerms[0];
    switch (term) {
      case '1':
        validFrom = `${startYear}-06-01`;
        // Extended validity: grace period allows access until next term starts
        validUntil = `${startYear}-10-07`; // 1 week into Term 2
        break;
      case '2':
        validFrom = `${startYear}-10-01`;
        // Extended validity: grace period allows access until next term starts
        validUntil = `${endYear}-02-07`; // 1 week into Term 3
        break;
      case '3':
        validFrom = `${endYear}-02-01`;
        // Extended validity: grace period allows access until academic year ends
        validUntil = `${endYear}-06-07`; // 1 week into new academic year
        break;
      default:
        validFrom = `${startYear}-06-01`;
        validUntil = `${endYear}-05-31`;
    }
  }
  
  return { validFrom, validUntil };
} 