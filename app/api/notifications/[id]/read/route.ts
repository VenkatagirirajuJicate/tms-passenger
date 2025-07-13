import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// PUT - Mark notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get current notification
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('read_by')
      .eq('id', id)
      .single();

    if (fetchError || !notification) {
      console.error('Error fetching notification:', fetchError);
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Check if already read
    const currentReadBy = notification.read_by || [];
    if (currentReadBy.includes(userId)) {
      return NextResponse.json({ 
        success: true, 
        message: 'Notification already marked as read' 
      });
    }

    // Update read_by array
    const { error } = await supabase
      .from('notifications')
      .update({ 
        read_by: [...currentReadBy, userId] 
      })
      .eq('id', id);

    if (error) {
      console.error('Error marking notification as read:', error);
      return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notification marked as read' 
    });

  } catch (error) {
    console.error('Error in notification read PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 