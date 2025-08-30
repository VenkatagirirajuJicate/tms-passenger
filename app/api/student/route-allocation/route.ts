import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('Student route allocation API called');
    
    // Get student ID from query parameters
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    
    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student ID is required',
        },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client with anon key (we'll handle RLS gracefully)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Try to fetch route allocation data
    let routeAllocation = null;
    let error = null;
    
    try {
      const { data, error: allocationError } = await supabase
        .from('student_route_allocations')
        .select(`
          id,
          student_id,
          route_id,
          boarding_stop_id,
          is_active,
          allocated_at,
          routes (
            id,
            route_number,
            route_name,
            start_location,
            end_location,
            fare,
            departure_time,
            arrival_time
          ),
          route_stops:boarding_stop_id (
            id,
            stop_name,
            stop_time,
            sequence_order
          )
        `)
        .eq('student_id', studentId)
        .eq('is_active', true)
        .single();

      if (!allocationError && data) {
        routeAllocation = data;
      } else if (allocationError && allocationError.code !== 'PGRST116') {
        // PGRST116 is "not found", which is fine
        // Other errors might be permission issues
        error = allocationError;
      }
    } catch (err) {
      console.warn('Route allocation query failed (likely RLS policy):', err);
      error = err;
    }
    
    // If we can't access route allocations due to RLS, check the student's allocated_route_id
    if (!routeAllocation) {
      try {
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select(`
            id,
            allocated_route_id,
            boarding_point,
            transport_enrolled,
            enrollment_status
          `)
          .eq('id', studentId)
          .single();

        if (!studentError && studentData && studentData.allocated_route_id) {
          // Fetch route information
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
            .eq('id', studentData.allocated_route_id)
            .single();

          if (!routeError && routeData) {
            // Create a mock allocation object
            routeAllocation = {
              id: `mock_${studentId}`,
              student_id: studentId,
              route_id: studentData.allocated_route_id,
              boarding_stop_id: null,
              is_active: studentData.transport_enrolled,
              allocated_at: new Date().toISOString(),
              routes: routeData,
              route_stops: null
            };
            
            console.log('🔍 API DEBUG: Route allocation found from students table fallback');
            console.log('   - Raw route data:', routeData);
            console.log('   - start_location:', routeData.start_location);
            console.log('   - end_location:', routeData.end_location);
          }
        }
      } catch (err) {
        console.warn('Student data query failed:', err);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        routeAllocation,
        hasActiveRoute: !!routeAllocation,
        error: error ? {
          code: error.code,
          message: error.message,
          hint: error.hint
        } : null
      },
      message: routeAllocation 
        ? 'Route allocation found' 
        : 'No active route allocation found'
    });

  } catch (error) {
    console.error('Student route allocation API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch route allocation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
