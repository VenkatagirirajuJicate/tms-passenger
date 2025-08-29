import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { driverId, settings, email } = body;

    if (!driverId || !settings) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: driverId, settings' },
        { status: 400 }
      );
    }

    // First try to find driver by the provided ID
    let { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, name, email')
      .eq('id', driverId)
      .single();

    // If not found by ID, try to find by email
    if (driverError || !driver) {
      console.log('Driver not found by ID, trying to find by email...');
      
      if (email) {
        const { data: driverByEmail, error: emailError } = await supabase
          .from('drivers')
          .select('id, name, email')
          .eq('email', email)
          .single();

        if (!emailError && driverByEmail) {
          driver = driverByEmail;
          console.log('Found driver by email for settings update:', driver.email);
        }
      }
    }

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404 }
      );
    }

    // Update location settings
    const { error: updateError } = await supabase
      .from('drivers')
      .update({
        location_sharing_enabled: settings.locationSharingEnabled,
        location_enabled: settings.locationTrackingEnabled,
        location_tracking_status: settings.locationTrackingEnabled ? 'active' : 'inactive'
      })
      .eq('id', driverId);

    if (updateError) {
      console.error('Error updating driver location settings:', updateError);
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
    console.error('Error in driver location settings API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');

    if (!driverId) {
      return NextResponse.json(
        { success: false, error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    // First try to find driver by the provided ID
    let { data: driver, error } = await supabase
      .from('drivers')
      .select(`
        id,
        name,
        email,
        location_sharing_enabled,
        location_enabled,
        location_tracking_status,
        last_location_update
      `)
      .eq('id', driverId)
      .single();

    // If not found by ID, try to find by email from auth context
    if (error || !driver) {
      console.log('Driver not found by ID, trying to find by email...');
      
      // Get the user email from the request headers or cookies
      const authHeader = request.headers.get('authorization');
      const cookies = request.headers.get('cookie');
      
      // For now, we'll need to get the email from the frontend
      // This is a temporary solution - in production, you'd want to validate the token
      const email = searchParams.get('email');
      
      if (email) {
        const { data: driverByEmail, error: emailError } = await supabase
          .from('drivers')
          .select(`
            id,
            name,
            email,
            location_sharing_enabled,
            location_enabled,
            location_tracking_status,
            last_location_update
          `)
          .eq('email', email)
          .single();

        if (!emailError && driverByEmail) {
          driver = driverByEmail;
          console.log('Found driver by email:', driver.email);
        }
      }
    }

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404 }
      );
    }

    // Return settings in the expected format
    const settings = {
      locationSharingEnabled: driver.location_sharing_enabled || false,
      locationTrackingEnabled: driver.location_enabled || false,
      updateInterval: 30000, // Default 30 seconds
      shareWithAdmin: true, // Default to true for admin access
      shareWithPassengers: true, // Default to true for passenger access
      trackingStatus: driver.location_tracking_status || 'inactive',
      lastUpdate: driver.last_location_update
    };

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('Error in driver location settings get API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
