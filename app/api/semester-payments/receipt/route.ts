import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

export async function GET(request: NextRequest) {
  try {
    console.log('Receipt API called');
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    
    console.log('Payment ID:', paymentId);

    if (!paymentId) {
      console.error('Payment ID is required');
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    console.log('Fetching payment details for ID:', paymentId);

    // Fetch payment details - using simple select to match working pattern
    const { data: payment, error: paymentError } = await supabase
      .from('semester_payments')
      .select(`
        id,
        student_id,
        allocated_route_id,
        stop_name,
        academic_year,
        semester,
        payment_status,
        amount_paid,
        payment_method,
        transaction_id,
        receipt_number,
        valid_from,
        valid_until,
        created_at,
        updated_at
      `)
      .eq('id', paymentId)
      .single();

    console.log('Payment query result:', payment);
    console.log('Payment query error:', paymentError);

    if (paymentError || !payment) {
      console.error('Payment not found:', paymentError);
      return NextResponse.json({ 
        error: 'Payment not found', 
        details: paymentError?.message 
      }, { status: 404 });
    }

    // Get student information separately
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', payment.student_id)
      .single();

    console.log('Student query result:', student);
    console.log('Student query error:', studentError);
    
    if (studentError) {
      console.error('Failed to fetch student data:', studentError.message);
    }
    
    if (student) {
      console.log('Available student fields:', Object.keys(student));
    }

    // Create fallback student data if query fails or has missing fields
    const studentData = {
      full_name: student?.full_name || student?.student_name || 'Student Name',
      roll_number: student?.roll_number || 'Not Available',
      email: student?.email || 'email@example.com',
      mobile: student?.mobile || 'Mobile Number',
      course: student?.course || student?.program || student?.department || 'Course',
      year: student?.year || student?.current_year || student?.academic_year || 'Year'
    };
    
    console.log('Final student data for receipt:', studentData);

    // Get route information
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select('route_number, route_name, start_location, end_location')
      .eq('id', payment.allocated_route_id)
      .single();

    console.log('Route query result:', route);
    console.log('Route query error:', routeError);

    if (routeError) {
      console.error('Error fetching route info:', routeError);
    }

    // Generate boarding pass style receipt HTML
    const receiptHTML = generateBoardingPassReceipt(payment, route, studentData);

    // Return HTML for the receipt
    return new NextResponse(receiptHTML, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename=receipt-${payment.receipt_number}.html`
      }
    });
  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json({ error: 'Failed to generate receipt' }, { status: 500 });
  }
}

function generateBoardingPassReceipt(payment: any, route: any, student: any) {
  const currentDate = new Date();
  const validFrom = payment.valid_from ? new Date(payment.valid_from) : new Date();
  const validUntil = payment.valid_until ? new Date(payment.valid_until) : new Date();
  
  // Handle missing amount_paid - fallback to a default value
  const amountPaid = payment.amount_paid || 5000;
  
  // Generate QR code data
  const receiptNumber = payment.receipt_number || `RCP-${payment.id.slice(-8).toUpperCase()}`;
  const qrData = JSON.stringify({
    receiptNo: receiptNumber,
    studentName: student.full_name,
    rollNumber: student.roll_number,
    amount: amountPaid,
    route: route?.route_name || 'Transport Route',
    academicYear: payment.academic_year,
    semester: payment.semester,
    validUntil: validUntil.toISOString().split('T')[0]
  });
  
  // Create simple QR code using a QR API service (qr-server.com)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transport Pass - ${payment.receipt_number}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .boarding-pass {
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
            width: 100%;
            max-width: 800px;
            position: relative;
        }
        
        .boarding-pass::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #4CAF50, #2196F3, #FF9800, #9C27B0);
        }
        
        .header {
            background: linear-gradient(135deg, #2196F3, #1976D2);
            color: white;
            padding: 25px;
            text-align: center;
            position: relative;
        }
        
        .header::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 15px solid transparent;
            border-right: 15px solid transparent;
            border-top: 10px solid #1976D2;
        }
        
        .college-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .transport-title {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 10px;
        }
        
        .receipt-number {
            font-size: 18px;
            font-weight: bold;
            background: rgba(255,255,255,0.2);
            padding: 8px 15px;
            border-radius: 20px;
            display: inline-block;
            margin-top: 10px;
        }
        
        .main-content {
            padding: 30px;
        }
        
        .pass-info {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 30px;
            margin-bottom: 30px;
            align-items: center;
        }
        
        .departure, .arrival {
            text-align: center;
        }
        
        .location {
            font-size: 20px;
            font-weight: bold;
            color: #2196F3;
            margin-bottom: 5px;
        }
        
        .time {
            font-size: 14px;
            color: #666;
            margin-bottom: 15px;
        }
        
        .route-visual {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        
        .route-line {
            width: 100px;
            height: 3px;
            background: linear-gradient(90deg, #4CAF50, #2196F3);
            position: relative;
            border-radius: 2px;
        }
        
        .route-line::before,
        .route-line::after {
            content: '';
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 10px;
            height: 10px;
            background: #4CAF50;
            border-radius: 50%;
        }
        
        .route-line::before {
            left: -5px;
        }
        
        .route-line::after {
            right: -5px;
            background: #2196F3;
        }
        
        .bus-icon {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #FF9800;
            color: white;
            width: 30px;
            height: 20px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
        }
        
        .passenger-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .detail-group {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #2196F3;
        }
        
        .detail-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
            font-weight: bold;
            letter-spacing: 1px;
        }
        
        .detail-value {
            font-size: 16px;
            color: #333;
            font-weight: bold;
        }
        
        .payment-summary {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 30px;
        }
        
        .amount {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .payment-status {
            font-size: 14px;
            background: rgba(255,255,255,0.2);
            padding: 5px 15px;
            border-radius: 15px;
            display: inline-block;
        }
        
        .validity {
            display: flex;
            justify-content: space-between;
            background: #fff3cd;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #ffeaa7;
            margin-bottom: 20px;
        }
        
        .validity-item {
            text-align: center;
        }
        
        .validity-label {
            font-size: 12px;
            color: #856404;
            margin-bottom: 5px;
        }
        
        .validity-date {
            font-size: 14px;
            font-weight: bold;
            color: #856404;
        }
        
                 .qr-section {
             text-align: center;
             margin-bottom: 30px;
         }
         
         .qr-code {
             width: 100px;
             height: 100px;
             border: 2px solid #ddd;
             border-radius: 8px;
             margin-bottom: 10px;
         }
        
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e9ecef;
        }
        
        .footer p {
            margin-bottom: 5px;
        }
        
        .important-note {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
        }
        
        .important-note strong {
            color: #856404;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .boarding-pass {
                box-shadow: none;
                max-width: none;
                width: 100%;
            }
        }
        
        @media (max-width: 768px) {
            .pass-info {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .passenger-details {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
            .validity {
                flex-direction: column;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="boarding-pass">
                 <div class="header">
             <div class="college-name">JKKN College of Engineering</div>
             <div class="transport-title">Transport Service Pass</div>
             <div class="receipt-number">Pass No: ${receiptNumber}</div>
         </div>
        
        <div class="main-content">
            <div class="pass-info">
                <div class="departure">
                    <div class="location">${route?.start_location || 'Start Location'}</div>
                    <div class="time">Route ${route?.route_number || 'N/A'}</div>
                    <div>Boarding: ${payment.stop_name}</div>
                </div>
                
                <div class="route-visual">
                    <div class="route-line">
                        <div class="bus-icon">🚌</div>
                    </div>
                </div>
                
                <div class="arrival">
                    <div class="location">${route?.end_location || 'End Location'}</div>
                    <div class="time">${route?.route_name || 'College Route'}</div>
                    <div>Destination: College</div>
                </div>
            </div>
            
            <div class="passenger-details">
                                 <div class="detail-group">
                     <div class="detail-label">Passenger Name</div>
                     <div class="detail-value">${student?.full_name || student?.student_name || 'Student Name'}</div>
                 </div>
                 
                 <div class="detail-group">
                     <div class="detail-label">Roll Number</div>
                     <div class="detail-value">${student?.roll_number || 'Not Available'}</div>
                 </div>
                 
                 <div class="detail-group">
                     <div class="detail-label">Course & Year</div>
                     <div class="detail-value">${student?.course || student?.program || 'Course'} - ${student?.year || student?.current_year || 'Year'}</div>
                 </div>
                
                <div class="detail-group">
                    <div class="detail-label">Academic Year</div>
                    <div class="detail-value">${payment.academic_year} - Semester ${payment.semester}</div>
                </div>
                
                                 <div class="detail-group">
                     <div class="detail-label">Payment Method</div>
                     <div class="detail-value">${(payment.payment_method || 'UPI').replace('_', ' ').toUpperCase()}</div>
                 </div>
                 
                 <div class="detail-group">
                     <div class="detail-label">Transaction ID</div>
                     <div class="detail-value">${payment.transaction_id || 'N/A'}</div>
                 </div>
            </div>
            
                         <div class="payment-summary">
                 <div class="amount">₹${amountPaid.toLocaleString()}</div>
                 <div class="payment-status">✓ Payment Confirmed</div>
             </div>
            
            <div class="validity">
                <div class="validity-item">
                    <div class="validity-label">Valid From</div>
                    <div class="validity-date">${validFrom.toLocaleDateString()}</div>
                </div>
                <div class="validity-item">
                    <div class="validity-label">Valid Until</div>
                    <div class="validity-date">${validUntil.toLocaleDateString()}</div>
                </div>
            </div>
            
                         <div class="qr-section">
                 <img src="${qrCodeUrl}" alt="QR Code" class="qr-code">
                 <div style="font-size: 10px; color: #666; margin-top: 5px;">
                     ${receiptNumber}
                 </div>
                 <div style="font-size: 12px; color: #666; margin-top: 5px;">
                     Show this pass to the bus driver
                 </div>
             </div>
            
            <div class="important-note">
                <strong>Important:</strong> This pass is valid for the academic year ${payment.academic_year}, Semester ${payment.semester}. 
                Please keep this pass with you while traveling. Lost passes will incur a replacement fee.
            </div>
        </div>
        
        <div class="footer">
            <p><strong>JKKN College of Engineering</strong></p>
            <p>Komarapalayam, Namakkal District, Tamil Nadu - 638183</p>
            <p>Transport Office: +91 4287 226 555 | Email: transport@jkkn.ac.in</p>
            <p>Generated on: ${currentDate.toLocaleDateString()} at ${currentDate.toLocaleTimeString()}</p>
            <p style="margin-top: 10px; font-size: 10px;">
                This is a computer-generated document. For queries, contact the transport office.
            </p>
        </div>
    </div>
</body>
</html>
  `;
} 