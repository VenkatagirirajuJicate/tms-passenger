import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

export async function POST(request: NextRequest) {
  try {
    const { subscription, userId } = await request.json();

    if (!subscription || !userId) {
      return NextResponse.json({ 
        error: 'Subscription and user ID are required' 
      }, { status: 400 });
    }

    // Validate subscription format
    if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({ 
        error: 'Invalid subscription format' 
      }, { status: 400 });
    }

    // Store or update push subscription in database
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        user_type: 'student',
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        user_agent: request.headers.get('user-agent') || '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,endpoint'
      })
      .select();

    if (error) {
      console.error('Error saving push subscription:', error);
      return NextResponse.json({ 
        error: 'Failed to save subscription' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Push subscription saved successfully',
      data 
    });

  } catch (error) {
    console.error('Error in push subscribe:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const endpoint = searchParams.get('endpoint');

    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    let query = supabase
      .from('push_subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('user_type', 'student');

    if (endpoint) {
      query = query.eq('endpoint', endpoint);
    }

    const { error } = await query;

    if (error) {
      console.error('Error removing push subscription:', error);
      return NextResponse.json({ 
        error: 'Failed to remove subscription' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Push subscription removed successfully' 
    });

  } catch (error) {
    console.error('Error in push unsubscribe:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 