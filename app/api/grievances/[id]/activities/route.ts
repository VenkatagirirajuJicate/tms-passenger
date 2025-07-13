import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a service role client that bypasses RLS
const getServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// GET endpoint to retrieve grievance activities for progress tracking
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const grievanceId = resolvedParams.id;

    if (!grievanceId) {
      return NextResponse.json(
        { success: false, error: 'Grievance ID is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Verify grievance exists
    const { data: grievance, error: grievanceError } = await supabase
      .from('grievances')
      .select('id, student_id, status, created_at, updated_at')
      .eq('id', grievanceId)
      .single();

    if (grievanceError || !grievance) {
      return NextResponse.json(
        { success: false, error: 'Grievance not found' },
        { status: 404 }
      );
    }

    // Get all activities for this grievance (public and system visibility only)
    const { data: activities, error: activitiesError } = await supabase
      .from('grievance_activity_log')
      .select(`
        id,
        grievance_id,
        activity_type,
        visibility,
        actor_type,
        actor_id,
        actor_name,
        action_description,
        action_details,
        is_milestone,
        created_at,
        updated_at
      `)
      .eq('grievance_id', grievanceId)
      .in('visibility', ['public', 'system'])
      .order('created_at', { ascending: true });

    if (activitiesError) {
      console.error('Activities query error:', activitiesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch activities' },
        { status: 500 }
      );
    }

    // Process activities to add metadata
    const processedActivities = (activities || []).map(activity => ({
      ...activity,
      formatted_timestamp: new Date(activity.created_at).toLocaleString(),
      time_ago: getTimeAgo(activity.created_at),
      is_admin_action: activity.actor_type === 'admin',
      is_system_action: activity.actor_type === 'system',
      is_student_action: activity.actor_type === 'student',
      activity_category: categorizeActivity(activity.activity_type),
      display_title: getDisplayTitle(activity.activity_type),
      display_icon: getDisplayIcon(activity.activity_type),
      display_color: getDisplayColor(activity.activity_type, activity.actor_type)
    }));

    // Get activity statistics
    const stats = {
      total_activities: processedActivities.length,
      admin_actions: processedActivities.filter(a => a.is_admin_action).length,
      system_actions: processedActivities.filter(a => a.is_system_action).length,
      student_actions: processedActivities.filter(a => a.is_student_action).length,
      milestones: processedActivities.filter(a => a.is_milestone).length,
      recent_activities: processedActivities.slice(-5), // Last 5 activities
      first_activity: processedActivities[0]?.created_at,
      last_activity: processedActivities[processedActivities.length - 1]?.created_at,
      activity_types: [...new Set(processedActivities.map(a => a.activity_type))],
      actors: [...new Set(processedActivities.map(a => a.actor_name).filter(Boolean))]
    };

    return NextResponse.json({
      success: true,
      data: processedActivities,
      stats,
      grievance_info: {
        id: grievance.id,
        status: grievance.status,
        created_at: grievance.created_at,
        updated_at: grievance.updated_at
      }
    });

  } catch (error) {
    console.error('Get activities error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch activities',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to get time ago string
function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

// Helper function to categorize activities
function categorizeActivity(activityType: string): string {
  const categories: Record<string, string> = {
    'grievance_created': 'submission',
    'grievance_assigned': 'assignment',
    'grievance_reassigned': 'assignment',
    'grievance_status_changed': 'status',
    'grievance_priority_changed': 'priority',
    'comment_added': 'communication',
    'admin_action_taken': 'action',
    'grievance_resolved': 'resolution',
    'grievance_closed': 'closure',
    'resolution_rated': 'feedback',
    'attachment_added': 'attachment',
    'notification_sent': 'notification'
  };
  return categories[activityType] || 'other';
}

// Helper function to get display title
function getDisplayTitle(activityType: string): string {
  const titles: Record<string, string> = {
    'grievance_created': 'GRIEVANCE SUBMITTED',
    'grievance_assigned': 'ASSIGNED TO ADMIN',
    'grievance_reassigned': 'REASSIGNED TO ADMIN',
    'grievance_status_changed': 'STATUS UPDATED',
    'grievance_priority_changed': 'PRIORITY CHANGED',
    'comment_added': 'COMMENT ADDED',
    'admin_action_taken': 'ADMIN ACTION TAKEN',
    'grievance_resolved': 'GRIEVANCE RESOLVED',
    'grievance_closed': 'GRIEVANCE CLOSED',
    'resolution_rated': 'RESOLUTION RATED',
    'attachment_added': 'ATTACHMENT ADDED',
    'notification_sent': 'NOTIFICATION SENT'
  };
  return titles[activityType] || 'ACTIVITY';
}

// Helper function to get display icon
function getDisplayIcon(activityType: string): string {
  const icons: Record<string, string> = {
    'grievance_created': 'file-text',
    'grievance_assigned': 'user-check',
    'grievance_reassigned': 'user-check',
    'grievance_status_changed': 'refresh-cw',
    'grievance_priority_changed': 'flag',
    'comment_added': 'message-square',
    'admin_action_taken': 'settings',
    'grievance_resolved': 'star',
    'grievance_closed': 'x-circle',
    'resolution_rated': 'star',
    'attachment_added': 'paperclip',
    'notification_sent': 'bell'
  };
  return icons[activityType] || 'activity';
}

// Helper function to get display color
function getDisplayColor(activityType: string, actorType: string): string {
  if (actorType === 'admin') {
    return 'blue';
  } else if (actorType === 'student') {
    return 'green';
  } else if (actorType === 'system') {
    return 'gray';
  }

  // Fallback based on activity type
  const colors: Record<string, string> = {
    'grievance_created': 'green',
    'grievance_assigned': 'blue',
    'grievance_reassigned': 'blue',
    'grievance_status_changed': 'orange',
    'grievance_priority_changed': 'yellow',
    'comment_added': 'purple',
    'admin_action_taken': 'blue',
    'grievance_resolved': 'green',
    'grievance_closed': 'gray',
    'resolution_rated': 'green',
    'attachment_added': 'indigo',
    'notification_sent': 'blue'
  };
  return colors[activityType] || 'gray';
} 