import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Get student ID from headers
    const studentId = request.headers.get('X-Student-ID');
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
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

    // Get student information
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, student_name, email, transport_enrolled, enrollment_status')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Get latest enrollment request if any
    const { data: enrollmentRequest, error: requestError } = await supabaseAdmin
      .from('transport_enrollment_requests')
      .select(`
        id,
        request_status,
        request_type,
        preferred_route_id,
        preferred_stop_id,
        requested_at,
        approved_at,
        approved_by,
        rejection_reason,
        admin_notes,
        special_requirements,
        routes:preferred_route_id (
          route_number,
          route_name,
          start_location,
          end_location
        ),
        route_stops:preferred_stop_id (
          stop_name,
          stop_time
        )
      `)
      .eq('student_id', studentId)
      .order('requested_at', { ascending: false })
      .limit(1)
      .single();

    if (requestError && requestError.code !== 'PGRST116') {
      console.error('Error fetching enrollment request:', requestError);
      return NextResponse.json(
        { error: 'Failed to fetch enrollment request' },
        { status: 500 }
      );
    }

    // Get current route allocation if enrolled
    let routeAllocation = null;
    if (student.transport_enrolled) {
      const { data: allocation, error: allocationError } = await supabaseAdmin
        .from('student_route_allocations')
        .select(`
          id,
          is_active,
          allocated_at,
          routes:route_id (
            route_number,
            route_name,
            start_location,
            end_location,
            departure_time,
            arrival_time,
            fare
          ),
          route_stops:boarding_stop_id (
            stop_name,
            stop_time
          )
        `)
        .eq('student_id', studentId)
        .eq('is_active', true)
        .single();

      if (!allocationError && allocation) {
        routeAllocation = allocation;
      }
    }

    // Get enrollment activities for tracking
    let activities: {
      id: string;
      activity_type: string;
      activity_description: string;
      metadata?: any;
      created_at: string;
      admin_users?: { name: string; email: string }[];
    }[] = [];
    if (enrollmentRequest) {
      const { data: activitiesData, error: activitiesError } = await supabaseAdmin
        .from('transport_enrollment_activities')
        .select(`
          id,
          activity_type,
          activity_description,
          metadata,
          created_at,
          admin_users:performed_by (
            name,
            email
          )
        `)
        .eq('request_id', enrollmentRequest.id)
        .order('created_at', { ascending: false });

      if (!activitiesError && activitiesData) {
        activities = activitiesData;
      }
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        student_name: student.student_name,
        email: student.email,
        transport_enrolled: student.transport_enrolled,
        enrollment_status: student.enrollment_status
      },
      request: enrollmentRequest ? {
        id: enrollmentRequest.id,
        request_status: enrollmentRequest.request_status,
        request_type: enrollmentRequest.request_type,
        preferred_route_id: enrollmentRequest.preferred_route_id,
        preferred_stop_id: enrollmentRequest.preferred_stop_id,
        requested_at: enrollmentRequest.requested_at,
        approved_at: enrollmentRequest.approved_at,
        rejection_reason: enrollmentRequest.rejection_reason,
        admin_notes: enrollmentRequest.admin_notes,
        special_requirements: enrollmentRequest.special_requirements,
        route_info: enrollmentRequest.routes,
        stop_info: enrollmentRequest.route_stops
      } : null,
      current_allocation: routeAllocation,
      activities: activities
    });

  } catch (error) {
    console.error('Error in enrollment status API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 