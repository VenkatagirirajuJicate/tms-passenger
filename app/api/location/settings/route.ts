import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, settings } = body;

    if (!studentId || !settings) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: studentId, settings' },
        { status: 400 }
      );
    }

    // Check if student exists
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('external_id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Update location settings
    const { error: updateError } = await supabase
      .from('students')
      .update({
        location_sharing_enabled: settings.locationSharingEnabled,
        location_enabled: settings.locationTrackingEnabled,
        // Store additional settings in a JSON column or separate table
        // For now, we'll use the existing columns
      })
      .eq('id', student.id);

    if (updateError) {
      console.error('Error updating location settings:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Location settings updated successfully'
    });

  } catch (error) {
    console.error('Error in location settings API:', error);
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

    // Get location settings for student
    const { data: student, error } = await supabase
      .from('students')
      .select(`
        id,
        location_sharing_enabled,
        location_enabled,
        last_location_update
      `)
      .eq('external_id', studentId)
      .single();

    if (error || !student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Return settings in the expected format
    const settings = {
      locationSharingEnabled: student.location_sharing_enabled || false,
      locationTrackingEnabled: student.location_enabled || false,
      updateInterval: 30000, // Default 30 seconds
      shareWithAdmin: true, // Default to true for admin access
      shareWithDriver: false, // Default to false for driver access
      shareWithParents: false, // Default to false for parent access
      lastUpdate: student.last_location_update
    };

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('Error in location settings get API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 