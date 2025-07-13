import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { preferred_route_id, preferred_stop_id, special_requirements } = await request.json();

    // Get student ID from headers
    const studentId = request.headers.get('X-Student-ID');
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Validate input
    if (!preferred_route_id || !preferred_stop_id) {
      return NextResponse.json(
        { error: 'Route and stop selection are required' },
        { status: 400 }
      );
    }

    // Create Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if student exists and is not already enrolled
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, student_name, roll_number, email, transport_enrolled, enrollment_status')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    if (student.transport_enrolled) {
      return NextResponse.json(
        { error: 'Student is already enrolled for transport' },
        { status: 400 }
      );
    }

    // Check if student has a pending request
    const { data: existingRequest, error: requestError } = await supabaseAdmin
      .from('transport_enrollment_requests')
      .select('id, request_status')
      .eq('student_id', studentId)
      .eq('request_status', 'pending')
      .single();

    if (requestError && requestError.code !== 'PGRST116') {
      console.error('Error checking existing request:', requestError);
      return NextResponse.json(
        { error: 'Failed to check existing enrollment requests' },
        { status: 500 }
      );
    }

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending enrollment request' },
        { status: 400 }
      );
    }

    // Verify route and stop exist
    const { data: route, error: routeError } = await supabaseAdmin
      .from('routes')
      .select('id, route_number, route_name, status, total_capacity, current_passengers')
      .eq('id', preferred_route_id)
      .single();

    if (routeError || !route) {
      return NextResponse.json(
        { error: 'Selected route not found' },
        { status: 404 }
      );
    }

    if (route.status !== 'active') {
      return NextResponse.json(
        { error: 'Selected route is not active' },
        { status: 400 }
      );
    }

    const { data: stop, error: stopError } = await supabaseAdmin
      .from('route_stops')
      .select('id, stop_name, route_id')
      .eq('id', preferred_stop_id)
      .eq('route_id', preferred_route_id)
      .single();

    if (stopError || !stop) {
      return NextResponse.json(
        { error: 'Selected stop not found or does not belong to the route' },
        { status: 404 }
      );
    }

    // Create enrollment request
    const { data: enrollmentRequest, error: createError } = await supabaseAdmin
      .from('transport_enrollment_requests')
      .insert({
        student_id: studentId,
        preferred_route_id: preferred_route_id,
        preferred_stop_id: preferred_stop_id,
        request_status: 'pending',
        request_type: 'new_enrollment',
        special_requirements: special_requirements || null,
        semester_id: new Date().getFullYear() + '-' + (new Date().getMonth() < 6 ? 'SPRING' : 'FALL'),
        academic_year: new Date().getFullYear().toString(),
        requested_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (createError) {
      console.error('Error creating enrollment request:', createError);
      return NextResponse.json(
        { error: 'Failed to create enrollment request' },
        { status: 500 }
      );
    }

    // Update student enrollment status
    await supabaseAdmin
      .from('students')
      .update({
        enrollment_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId);

    // Create activity log
    await supabaseAdmin
      .from('transport_enrollment_activities')
      .insert({
        request_id: enrollmentRequest.id,
        activity_type: 'created',
        activity_description: `Enrollment request created for route ${route.route_number} - ${route.route_name}`,
        metadata: {
          route_id: preferred_route_id,
          stop_id: preferred_stop_id,
          route_name: route.route_name,
          stop_name: stop.stop_name,
          special_requirements: special_requirements
        }
      });

    // Send notifications
    try {
      // Create student notification
      await supabaseAdmin
        .from('notifications')
        .insert({
          title: 'Enrollment Request Submitted',
          message: `Your transport enrollment request for route ${route.route_number} has been submitted successfully. We'll notify you once it's reviewed.`,
          type: 'info',
          category: 'enrollment',
          target_audience: 'students',
          specific_users: [studentId],
          is_active: true,
          actionable: true,
          primary_action: {
            text: 'Check Status',
            url: '/dashboard'
          },
          tags: ['enrollment', 'transport'],
          metadata: {
            route_id: preferred_route_id,
            route_number: route.route_number,
            stop_name: stop.stop_name,
            submission_date: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });

      // Get admin users for notification
      const { data: admins } = await supabaseAdmin
        .from('admin_users')
        .select('id')
        .in('role', ['super_admin', 'transport_manager'])
        .eq('is_active', true);

      if (admins && admins.length > 0) {
        // Create admin notification
        await supabaseAdmin
          .from('notifications')
          .insert({
            title: 'New Transport Enrollment Request',
            message: `${student.student_name} (${student.roll_number}) has submitted a transport enrollment request for route ${route.route_number}.`,
            type: 'info',
            category: 'transport',
            target_audience: 'admins',
            specific_users: admins.map(admin => admin.id),
            is_active: true,
            actionable: true,
            primary_action: {
              text: 'Review Request',
              url: '/enrollment-requests'
            },
            tags: ['enrollment', 'admin', 'review-required'],
            metadata: {
              request_id: enrollmentRequest.id,
              student_id: studentId,
              route_id: preferred_route_id,
              submission_date: new Date().toISOString()
            },
            created_at: new Date().toISOString()
          });
      }
    } catch (notificationError) {
      console.error('Failed to send enrollment notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({
      success: true,
      request: {
        id: enrollmentRequest.id,
        request_status: enrollmentRequest.request_status,
        preferred_route_id: enrollmentRequest.preferred_route_id,
        preferred_stop_id: enrollmentRequest.preferred_stop_id,
        requested_at: enrollmentRequest.requested_at,
        route_info: {
          route_number: route.route_number,
          route_name: route.route_name
        },
        stop_info: {
          stop_name: stop.stop_name
        }
      },
      message: 'Enrollment request submitted successfully'
    });

  } catch (error) {
    console.error('Error in enrollment request API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 