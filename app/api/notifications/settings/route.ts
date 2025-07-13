import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

// GET - Get notification settings for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user's notification settings from system_settings or create default
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', `notification_settings_${userId}`)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notification settings:', error);
      return NextResponse.json({ error: 'Failed to fetch notification settings' }, { status: 500 });
    }

    // Default settings if none exist
    const defaultSettings = {
      pushEnabled: true,
      emailEnabled: false,
      smsEnabled: false,
      categories: {
        transport: true,
        payment: true,
        system: true,
        emergency: true
      },
      types: {
        info: true,
        warning: true,
        error: true,
        success: true
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '07:00'
      },
      soundEnabled: true,
      vibrationEnabled: true
    };

    const userSettings = settings ? settings.setting_value : defaultSettings;

    return NextResponse.json({
      success: true,
      data: userSettings
    });

  } catch (error) {
    console.error('Error in notification settings GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update notification settings for a user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, settings } = body;

    if (!userId || !settings) {
      return NextResponse.json({ error: 'User ID and settings are required' }, { status: 400 });
    }

    // Validate settings structure
    const validSettings = {
      pushEnabled: typeof settings.pushEnabled === 'boolean' ? settings.pushEnabled : true,
      emailEnabled: typeof settings.emailEnabled === 'boolean' ? settings.emailEnabled : false,
      smsEnabled: typeof settings.smsEnabled === 'boolean' ? settings.smsEnabled : false,
      categories: {
        transport: typeof settings.categories?.transport === 'boolean' ? settings.categories.transport : true,
        payment: typeof settings.categories?.payment === 'boolean' ? settings.categories.payment : true,
        system: typeof settings.categories?.system === 'boolean' ? settings.categories.system : true,
        emergency: typeof settings.categories?.emergency === 'boolean' ? settings.categories.emergency : true
      },
      types: {
        info: typeof settings.types?.info === 'boolean' ? settings.types.info : true,
        warning: typeof settings.types?.warning === 'boolean' ? settings.types.warning : true,
        error: typeof settings.types?.error === 'boolean' ? settings.types.error : true,
        success: typeof settings.types?.success === 'boolean' ? settings.types.success : true
      },
      quietHours: {
        enabled: typeof settings.quietHours?.enabled === 'boolean' ? settings.quietHours.enabled : false,
        startTime: typeof settings.quietHours?.startTime === 'string' ? settings.quietHours.startTime : '22:00',
        endTime: typeof settings.quietHours?.endTime === 'string' ? settings.quietHours.endTime : '07:00'
      },
      soundEnabled: typeof settings.soundEnabled === 'boolean' ? settings.soundEnabled : true,
      vibrationEnabled: typeof settings.vibrationEnabled === 'boolean' ? settings.vibrationEnabled : true,
      updatedAt: new Date().toISOString()
    };

    // Upsert settings
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        setting_key: `notification_settings_${userId}`,
        setting_value: validSettings,
        description: `Notification settings for user ${userId}`,
        is_public: false,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating notification settings:', error);
      return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: validSettings
    });

  } catch (error) {
    console.error('Error in notification settings PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 