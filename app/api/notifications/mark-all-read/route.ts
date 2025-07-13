import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// PUT - Mark all notifications as read for a user
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get all unread notifications for the user
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('id, read_by')
      .eq('is_active', true)
      .or(`target_audience.in.(all,students),specific_users.cs.{${userId}}`)
      .or('expires_at.is.null,expires_at.gt.now()');

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Filter unread notifications
    interface NotificationItem {
      id: string;
      read_by?: string[];
    }

    const unreadNotifications = notifications?.filter((notification: NotificationItem) => 
      !notification.read_by?.includes(userId)
    ) || [];

    if (unreadNotifications.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No unread notifications to mark as read',
        updatedCount: 0
      });
    }

    // Update all unread notifications
    const updatePromises = unreadNotifications.map((notification: NotificationItem) => {
      const currentReadBy = notification.read_by || [];
      return supabase
        .from('notifications')
        .update({ 
          read_by: [...currentReadBy, userId] 
        })
        .eq('id', notification.id);
    });

    const results = await Promise.all(updatePromises);
    
    // Check for any errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Error marking notifications as read:', errors);
      return NextResponse.json({ 
        error: 'Failed to mark some notifications as read',
        details: errors
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `${unreadNotifications.length} notifications marked as read`,
      updatedCount: unreadNotifications.length
    });

  } catch (error) {
    console.error('Error in mark-all-read PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 