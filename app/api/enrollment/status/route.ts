import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('Enrollment status API called');
    
    // Get user info from headers or query params if available
    const authHeader = request.headers.get('authorization');
    const userId = request.nextUrl.searchParams.get('userId');
    const studentId = request.nextUrl.searchParams.get('studentId');
    
    console.log('Enrollment status check for:', { userId, studentId, hasAuth: !!authHeader });
    
    if (!studentId && !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student ID or User ID is required',
        },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client - use service role for write operations if available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
      throw new Error('Supabase configuration missing');
    }
    
    // Use service role key if available (for write operations), otherwise use anon key
    const supabaseKey = supabaseServiceKey || supabaseAnonKey;
    const keyType = supabaseServiceKey ? 'service_role' : 'anon';
    
    console.log(`🔑 Using Supabase key type: ${keyType} for enrollment status check`);
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Use studentId if provided, otherwise use userId
    const searchId = studentId || userId;
    
    // Fetch student information - optimized lookup strategy
    let student = null;
    let studentError = null;

    // Detect if this is likely a JWT-based request (external student ID)
    // JWT tokens from parent app use UUID format for sub field
    const isLikelyJwtToken = searchId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchId);
    
    const studentSelectFields = `
      id,
      student_name,
      email,
      roll_number,
      transport_enrolled,
      enrollment_status,
      allocated_route_id,
      boarding_point,
      transport_status,
      payment_status,
      outstanding_amount,
      total_fines,
      external_student_id
    `;

    if (isLikelyJwtToken) {
      // For JWT tokens, try external_student_id first (most likely to succeed)
      console.log('🔍 Detected JWT token format, trying external_student_id lookup first');
      
      const { data: externalStudent, error: externalError } = await supabase
        .from('students')
        .select(studentSelectFields)
        .eq('external_student_id', searchId)
        .single();

      if (!externalError && externalStudent) {
        student = externalStudent;
        console.log('✅ Found student by external ID lookup:', student.email);
      } else {
        console.log('❌ External ID lookup failed, trying direct ID fallback:', externalError?.message);
        
        // Fallback to direct ID lookup
        const { data: directStudent, error: directError } = await supabase
          .from('students')
          .select(studentSelectFields)
          .eq('id', searchId)
          .single();

        if (!directError && directStudent) {
          student = directStudent;
          console.log('✅ Found student by direct ID fallback:', student.email);
        } else {
          console.log('❌ Direct ID fallback also failed:', directError?.message);
          studentError = externalError; // Use the external error as primary
        }
      }
    } else {
      // For non-JWT requests, try direct ID first
      console.log('🔍 Non-JWT format detected, trying direct ID lookup first');
      
      const { data: directStudent, error: directError } = await supabase
        .from('students')
        .select(studentSelectFields)
        .eq('id', searchId)
        .single();

      if (!directError && directStudent) {
        student = directStudent;
        console.log('✅ Found student by direct ID lookup:', student.email);
      } else {
        console.log('❌ Direct ID lookup failed, trying external ID fallback:', directError?.message);
        
        // Fallback to external student ID lookup
        const { data: externalStudent, error: externalError } = await supabase
          .from('students')
          .select(studentSelectFields)
          .eq('external_student_id', searchId)
          .single();

        if (!externalError && externalStudent) {
          student = externalStudent;
          console.log('✅ Found student by external ID fallback:', student.email);
        } else {
          console.log('❌ External ID fallback also failed:', externalError?.message);
          studentError = directError; // Use the direct error as primary
        }
      }
    }

    // Strategy 3: If both previous strategies failed, try UUID pattern search with OR condition
    if (!student && studentError) {
      console.log('🔍 All direct lookups failed, trying UUID pattern search...');
      
      const { data: uuidStudents, error: uuidError } = await supabase
        .from('students')
        .select(studentSelectFields)
        .or(`id.eq.${searchId},external_student_id.eq.${searchId}`)
        .limit(1);

      if (!uuidError && uuidStudents && uuidStudents.length > 0) {
        student = uuidStudents[0];
        console.log('✅ Found student by UUID pattern search:', student.email);
        studentError = null; // Clear the error since we found the student
      } else {
        console.log('❌ UUID pattern search also failed:', uuidError?.message);
      }
    }

    // Strategy 4: If student still not found, try email-based lookup
    if (!student && studentError) {
      console.log('🔍 All ID-based lookups failed, trying email-based lookup...');
      
      // Extract email from JWT token if available
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const payload = JSON.parse(atob(token.split('.')[1]));
          
          if (payload.email) {
            console.log('🔍 Trying to find student by email:', payload.email);
            
            const { data: emailStudent, error: emailError } = await supabase
              .from('students')
              .select(studentSelectFields)
              .eq('email', payload.email)
              .single();
            
            if (!emailError && emailStudent) {
              student = emailStudent;
              studentError = null;
              console.log('✅ Found student by email lookup:', {
                id: emailStudent.id,
                email: emailStudent.email,
                rollNumber: emailStudent.roll_number
              });
              
              // Update the external_student_id to match the JWT sub if different
              if (emailStudent.external_student_id !== searchId) {
                console.log('🔄 Updating external_student_id to match JWT sub');
                await supabase
                  .from('students')
                  .update({ external_student_id: searchId })
                  .eq('id', emailStudent.id);
              }
            } else {
              console.log('❌ Email lookup also failed:', emailError?.message);
            }
          }
        } catch (error) {
          console.log('❌ Could not extract email from JWT for lookup:', error);
        }
      }
    }

    // Strategy 5: If student still not found, try to create from parent app data
    if (!student && studentError) {
      console.log('🔍 Student not found in database, attempting to create from parent app...');
      
      try {
        // Try to get user data from the request context or create a mock user for the student ID
        // This is a fallback mechanism for when students authenticate but don't have local records
        
        // Try to get actual user data from JWT token if available
        let userEmail = `student-${searchId.substring(0, 8)}@temp.local`;
        let userName = `Student ${searchId.substring(0, 8)}`;
        
        // Check if we have JWT token in headers to extract real user data
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          try {
            const token = authHeader.substring(7);
            // Simple JWT decode (just for getting user info, not for security)
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('🔍 Extracted JWT payload for student creation:', payload);
            
            if (payload.email) {
              userEmail = payload.email;
              userName = payload.name || payload.full_name || `Student ${payload.email.split('@')[0]}`;
              console.log('✅ Using real user data from JWT:', { userEmail, userName });
            }
          } catch (error) {
            console.log('❌ Could not decode JWT for user info:', error);
          }
        } else {
          console.log('⚠️ No authorization header found, using mock data');
        }
        
        const mockParentUser = {
          id: searchId,
          email: userEmail,
          full_name: userName,
          role: 'student',
          permissions: {},
          // Add the student ID as external reference
          studentId: searchId
        };

        console.log('🔄 Creating student record for:', {
          email: mockParentUser.email,
          name: mockParentUser.full_name,
          studentId: searchId
        });

        // Generate a temporary roll number from email or student ID
        const tempRollNumber = mockParentUser.email.split('@')[0].toUpperCase() || 
                              `TEMP${searchId.substring(0, 8).toUpperCase()}`;

        // Generate a temporary mobile number (required field)
        const tempMobile = '9999999999'; // Default mobile number for auto-created students

        console.log('🔢 Generated data for student:', {
          rollNumber: tempRollNumber,
          mobile: tempMobile
        });

        // Create the student record in the database
        const { data: newStudent, error: createError } = await supabase
          .from('students')
          .insert({
            id: searchId, // Use the provided student ID as primary key
            student_name: mockParentUser.full_name,
            roll_number: tempRollNumber, // Required field - generate from email or ID
            email: mockParentUser.email,
            mobile: tempMobile, // Required field - temporary mobile number
            external_student_id: searchId, // Also store as external reference
            auth_source: 'external_api', // Valid enum value for parent app integration
            transport_enrolled: false,
            enrollment_status: 'pending', // Valid enum value from transport_request_status
            transport_status: 'inactive',
            payment_status: 'current', // Valid enum value from payment_status
            outstanding_amount: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select(studentSelectFields)
          .single();

        if (!createError && newStudent) {
          student = newStudent;
          studentError = null;
          console.log('✅ Successfully created student record:', {
            id: newStudent.id,
            email: newStudent.email,
            rollNumber: newStudent.roll_number,
            externalStudentId: newStudent.external_student_id
          });
        } else {
          console.error('❌ Failed to create student record:', {
            error: createError,
            attemptedData: {
              id: searchId,
              email: mockParentUser.email,
              rollNumber: tempRollNumber
            }
          });
          
          // If it's a duplicate email error, try to find the existing student by email
          if (createError?.code === '23505' && createError?.details?.includes('email')) {
            console.log('🔍 Duplicate email detected, trying to find existing student by email...');
            
            const { data: existingStudent, error: findError } = await supabase
              .from('students')
              .select(studentSelectFields)
              .eq('email', mockParentUser.email)
              .single();
            
            if (!findError && existingStudent) {
              student = existingStudent;
              studentError = null;
              console.log('✅ Found existing student with duplicate email:', {
                id: existingStudent.id,
                email: existingStudent.email,
                rollNumber: existingStudent.roll_number
              });
              
              // Update the external_student_id to match the JWT sub if different
              if (existingStudent.external_student_id !== searchId) {
                console.log('🔄 Updating external_student_id to match JWT sub');
                await supabase
                  .from('students')
                  .update({ external_student_id: searchId })
                  .eq('id', existingStudent.id);
              }
            } else {
              console.error('❌ Could not find existing student by email:', findError);
            }
          }
        }
      } catch (creationError) {
        console.error('❌ Error during student creation:', creationError);
      }
    }

    if (studentError && !student) {
      console.error('❌ Student lookup error (all strategies failed):', {
        studentId: searchId,
        originalError: studentError
      });
      // Return mock data if student not found (for fallback)
      const mockEnrollmentStatus = {
        isEnrolled: false,
        enrollmentId: null,
        status: 'not_enrolled',
        enrollmentDate: null,
        expiryDate: null,
        selectedRoute: null,
        selectedStop: null,
        paymentStatus: 'pending',
        lastPaymentDate: null,
        nextPaymentDue: null,
        totalFees: 0,
        paidAmount: 0,
        pendingAmount: 0,
        canEnroll: true,
        canModify: false,
        restrictions: [],
        notifications: [
          {
            id: 'enroll_001',
            type: 'info',
            title: 'Transport Enrollment Available',
            message: 'You can now enroll for transport services. Choose your preferred route and complete the payment.',
            date: new Date().toISOString(),
            isRead: false
          }
        ],
        availableActions: [
          {
            action: 'enroll',
            label: 'Enroll for Transport',
            enabled: true,
            description: 'Start your transport enrollment process'
          },
          {
            action: 'view_routes',
            label: 'View Available Routes',
            enabled: true,
            description: 'Browse all available transport routes'
          }
        ],
        history: [],
        documents: {
          required: [
            {
              type: 'student_id',
              name: 'Student ID Card',
              status: 'pending',
              required: true
            }
          ],
          uploaded: []
        }
      };

      return NextResponse.json({
        success: false,
        error: `Student not found with ID "${searchId}". Please ensure you are properly enrolled in the system.`,
        student: null,
        enrollment: mockEnrollmentStatus,
        hasActiveRequest: false,
        activeRequest: null,
        message: 'Student record not found. Please contact support to verify your account setup.',
        debug: {
          searchId,
          strategies_attempted: ['direct_id', 'external_student_id', 'uuid_pattern_search'],
          error_code: 'STUDENT_NOT_FOUND'
        }
      });
    }

    // Fetch enrollment requests for this student
    const { data: enrollmentRequests, error: requestsError } = await supabase
      .from('transport_enrollment_requests')
      .select(`
        id,
        preferred_route_id,
        preferred_stop_id,
        request_status,
        request_type,
        requested_at,
        approved_at,
        rejection_reason,
        admin_notes,
        routes:preferred_route_id (
          route_number,
          route_name,
          start_location,
          end_location,
          fare
        ),
        route_stops:preferred_stop_id (
          stop_name
        )
      `)
      .eq('student_id', student.id)
      .order('requested_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching enrollment requests:', requestsError);
    }

    // Get the latest enrollment request
    const latestRequest = enrollmentRequests?.[0];
    
    // Fetch current route information if student is enrolled
    let selectedRoute = null;
    if (student.allocated_route_id) {
      const { data: routeData, error: routeError } = await supabase
        .from('routes')
        .select(`
          id,
          route_number,
          route_name,
          start_location,
          end_location,
          fare,
          departure_time,
          arrival_time
        `)
        .eq('id', student.allocated_route_id)
        .single();

      if (!routeError && routeData) {
        selectedRoute = {
          id: routeData.id,
          routeNumber: routeData.route_number,
          routeName: routeData.route_name,
          startLocation: routeData.start_location,
          endLocation: routeData.end_location,
          fare: parseFloat(routeData.fare || '0'),
          departureTime: routeData.departure_time,
          arrivalTime: routeData.arrival_time
        };
      }
    }

    // Determine enrollment status and available actions
    const isEnrolled = student.transport_enrolled || false;
    const enrollmentStatus = student.enrollment_status || 'pending';
    
    const availableActions = [];
    
    if (!isEnrolled && enrollmentStatus !== 'pending') {
      availableActions.push({
        action: 'enroll',
        label: 'Enroll for Transport',
        enabled: true,
        description: 'Start your transport enrollment process'
      });
    }
    
    if (isEnrolled) {
      availableActions.push({
        action: 'modify',
        label: 'Modify Enrollment',
        enabled: true,
        description: 'Request to change your current route or stop'
      });
      
      availableActions.push({
        action: 'cancel',
        label: 'Cancel Enrollment',
        enabled: true,
        description: 'Cancel your transport enrollment'
      });
    }

    availableActions.push({
      action: 'view_routes',
      label: 'View Available Routes',
      enabled: true,
      description: 'Browse all available transport routes'
    });

    // Create notifications based on current status
    const notifications = [];
    
    if (latestRequest) {
      if (latestRequest.request_status === 'pending') {
        notifications.push({
          id: 'enroll_pending',
          type: 'warning',
          title: 'Application Under Review',
          message: 'Your transport enrollment application is being reviewed by the admin team.',
          date: latestRequest.requested_at,
          isRead: false
        });
      } else if (latestRequest.request_status === 'approved') {
        notifications.push({
          id: 'enroll_approved',
          type: 'success',
          title: 'Application Approved',
          message: 'Congratulations! Your transport enrollment application has been approved.',
          date: latestRequest.approved_at || latestRequest.requested_at,
          isRead: false
        });
      } else if (latestRequest.request_status === 'rejected') {
        notifications.push({
          id: 'enroll_rejected',
          type: 'error',
          title: 'Application Rejected',
          message: `Your transport enrollment application was rejected. Reason: ${latestRequest.rejection_reason || 'Not specified'}`,
          date: latestRequest.requested_at,
          isRead: false
        });
      }
    }

    if (!isEnrolled && enrollmentStatus !== 'pending') {
      notifications.push({
        id: 'enroll_available',
        type: 'info',
        title: 'Transport Enrollment Available',
        message: 'You can now enroll for transport services. Choose your preferred route and complete the payment.',
        date: new Date().toISOString(),
        isRead: false
      });
    }

    // Calculate payment information
    const outstandingAmount = parseFloat(student.outstanding_amount || '0');
    const totalFines = parseFloat(student.total_fines || '0');
    const routeFare = selectedRoute?.fare || 0;
    const totalFees = routeFare + totalFines;
    const paidAmount = Math.max(0, totalFees - outstandingAmount);

    const enrollmentStatusData = {
      isEnrolled,
      enrollmentId: latestRequest?.id || null,
      status: enrollmentStatus,
      enrollmentDate: latestRequest?.approved_at || latestRequest?.requested_at || null,
      expiryDate: null, // You can calculate this based on semester/academic year
      selectedRoute,
      selectedStop: student.boarding_point,
      paymentStatus: student.payment_status || 'pending',
      lastPaymentDate: null, // You can fetch this from payments table
      nextPaymentDue: null, // You can calculate this based on payment schedule
      totalFees,
      paidAmount,
      pendingAmount: outstandingAmount,
      canEnroll: !isEnrolled && enrollmentStatus !== 'pending',
      canModify: isEnrolled,
      restrictions: totalFines > 0 ? [`Outstanding fines: ₹${totalFines}`] : [],
      notifications,
      availableActions,
      history: enrollmentRequests?.map(req => ({
        id: req.id,
        action: req.request_type,
        status: req.request_status,
        date: req.requested_at,
        route: (req.routes as any)?.route_name,
        stop: (req.route_stops as any)?.stop_name,
        notes: req.admin_notes
      })) || [],
      documents: {
        required: [
          {
            type: 'student_id',
            name: 'Student ID Card',
            status: 'verified', // Assume verified if student exists
            required: true
          },
          {
            type: 'address_proof',
            name: 'Address Proof',
            status: 'pending',
            required: false
          }
        ],
        uploaded: []
      },
      transportStatus: student.transport_status,
      studentInfo: {
        name: student.student_name,
        email: student.email,
        rollNumber: student.roll_number
      }
    };

    console.log(`✅ Fetched enrollment status for student: ${student.email}`);

    return NextResponse.json({
      success: true,
      enrollment: enrollmentStatusData,
      message: 'Enrollment status fetched successfully from database'
    });

  } catch (error) {
    console.error('Enrollment status API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch enrollment status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Enrollment enrollment/update API called');
    
    const body = await request.json();
    const { action, routeId, stopId, userId } = body;
    
    console.log('Enrollment action:', { action, routeId, stopId, userId });
    
    // Mock enrollment action processing
    let response;
    
    switch (action) {
      case 'enroll':
        response = {
          success: true,
          enrollmentId: `enroll_${Date.now()}`,
          status: 'pending',
          message: 'Enrollment request submitted successfully. Please complete the payment to activate your transport service.',
          nextSteps: [
            'Complete payment process',
            'Upload required documents',
            'Wait for approval'
          ],
          paymentUrl: `/payment/transport?enrollment=${Date.now()}`
        };
        break;
        
      case 'modify':
        response = {
          success: true,
          message: 'Enrollment modification request submitted successfully.',
          status: 'modification_pending'
        };
        break;
        
      case 'cancel':
        response = {
          success: true,
          message: 'Enrollment cancellation request submitted successfully.',
          status: 'cancellation_pending',
          refundInfo: {
            eligibleAmount: 500,
            processingTime: '7-10 business days'
          }
        };
        break;
        
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            validActions: ['enroll', 'modify', 'cancel']
          },
          { status: 400 }
        );
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Enrollment action API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process enrollment action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
