import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, latitude, longitude, accuracy, timestamp } = body;

    // Validate required fields
    if (!studentId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: studentId, latitude, longitude' },
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { success: false, error: 'Invalid latitude value' },
        { status: 400 }
      );
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { success: false, error: 'Invalid longitude value' },
        { status: 400 }
      );
    }

    // Check if student exists and has location sharing enabled
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, location_sharing_enabled, location_enabled')
      .eq('external_id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if location sharing is enabled for this student
    if (!student.location_sharing_enabled) {
      return NextResponse.json(
        { success: false, error: 'Location sharing is disabled for this student' },
        { status: 403 }
      );
    }

    // Update student location
    const { error: updateError } = await supabase
      .from('students')
      .update({
        current_latitude: latitude,
        current_longitude: longitude,
        location_accuracy: accuracy || null,
        location_timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
        last_location_update: new Date().toISOString()
      })
      .eq('id', student.id);

    if (updateError) {
      console.error('Error updating student location:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update location' },
        { status: 500 }
      );
    }

    // Log location update for audit purposes
    console.log(`Location updated for student ${studentId}: ${latitude}, ${longitude}`);

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in location update API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Get current location for student
    const { data: student, error } = await supabase
      .from('students')
      .select(`
        id,
        current_latitude,
        current_longitude,
        location_accuracy,
        location_timestamp,
        last_location_update,
        location_sharing_enabled,
        location_enabled
      `)
      .eq('external_id', studentId)
      .single();

    if (error || !student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      location: {
        latitude: student.current_latitude,
        longitude: student.current_longitude,
        accuracy: student.location_accuracy,
        timestamp: student.location_timestamp,
        lastUpdate: student.last_location_update,
        sharingEnabled: student.location_sharing_enabled,
        trackingEnabled: student.location_enabled
      }
    });

  } catch (error) {
    console.error('Error in location get API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 