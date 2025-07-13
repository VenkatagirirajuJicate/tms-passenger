import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

interface SchedulingSettings {
  enableBookingTimeWindow: boolean;
  bookingWindowEndHour: number;
  bookingWindowDaysBefore: number;
  autoNotifyPassengers: boolean;
  sendReminderHours: number[];
}

export async function GET() {
  try {
    const supabase = createClient();
    
    // Get admin settings from database
    const { data: settingsData, error: settingsError } = await supabase
      .from('admin_settings')
      .select('settings_data')
      .eq('setting_type', 'scheduling')
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching settings:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Return settings if found, otherwise return defaults
    const settings: SchedulingSettings = settingsData?.settings_data || {
      enableBookingTimeWindow: true,
      bookingWindowEndHour: 19, // 7 PM cutoff
      bookingWindowDaysBefore: 1,
      autoNotifyPassengers: true,
      sendReminderHours: [24, 2]
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error in settings API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 