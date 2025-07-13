import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// GET - Fetch student notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const category = searchParams.get('category');
    const since = searchParams.get('since');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Build query
    let query = supabase
      .from('notifications')
      .select(`
        id,
        title,
        message,
        type,
        category,
        target_audience,
        specific_users,
        is_active,
        scheduled_at,
        expires_at,
        enable_push_notification,
        enable_email_notification,
        enable_sms_notification,
        actionable,
        primary_action,
        secondary_action,
        tags,
        read_by,
        created_by,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .or(`target_audience.in.(all,students),specific_users.cs.{${userId}}`)
      .order('created_at', { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (since) {
      query = query.gt('created_at', since);
    }

    // Filter out expired notifications
    query = query.or('expires_at.is.null,expires_at.gt.now()');

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Format notifications and check read status
    interface NotificationData {
      id: string;
      title: string;
      message: string;
      type: string;
      category: string;
      target_audience: string;
      specific_users: string[];
      is_active: boolean;
      read_by?: string[];
      created_at: string;
      updated_at: string;
      [key: string]: unknown;
    }

    const formattedNotifications = data?.map((notification: NotificationData) => ({
      ...notification,
      read: notification.read_by?.includes(userId) || false
    })) || [];

    // Filter unread if requested
    interface FormattedNotification extends NotificationData {
      read: boolean;
    }

    const filteredNotifications = unreadOnly 
      ? formattedNotifications.filter((n: FormattedNotification) => !n.read)
      : formattedNotifications;

    return NextResponse.json({
      success: true,
      data: {
        notifications: filteredNotifications,
        pagination: {
          limit,
          offset,
          total: filteredNotifications.length,
          hasMore: filteredNotifications.length === limit
        }
      }
    });

  } catch (error) {
    console.error('Error in notifications GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create notification (for admin use)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const {
      title,
      message,
      type = 'info',
      category = 'transport',
      target_audience = 'students',
      specific_users = [],
      scheduled_at,
      expires_at,
      enable_push_notification = true,
      enable_email_notification = false,
      enable_sms_notification = false,
      actionable = false,
      primary_action,
      secondary_action,
      tags = [],
      created_by
    } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        type,
        category,
        target_audience,
        specific_users,
        scheduled_at,
        expires_at,
        enable_push_notification,
        enable_email_notification,
        enable_sms_notification,
        actionable,
        primary_action,
        secondary_action,
        tags,
        created_by
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error in notifications POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 