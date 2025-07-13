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

// GET endpoint to retrieve grievance details with activity timeline for passengers
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

    // Get grievance details with enriched information
    const { data: grievance, error: grievanceError } = await supabase
      .from('grievances')
      .select(`
        id,
        category,
        priority,
        subject,
        description,
        status,
        created_at,
        updated_at,
        expected_resolution_date,
        resolved_at,
        resolution,
        resolution_rating,
        resolution_feedback,
        rated_at,
        student_id,
        route_id,
        assigned_to,
        admin_users!assigned_to (
          id,
          name,
          role,
          email
        ),
        routes (
          id,
          route_name,
          route_number,
          start_location,
          end_location
        )
      `)
      .eq('id', grievanceId)
      .single();

    if (grievanceError) {
      console.error('Grievance query error:', grievanceError);
      throw grievanceError;
    }

    if (!grievance) {
      return NextResponse.json(
        { success: false, error: 'Grievance not found' },
        { status: 404 }
      );
    }

    // Get activity timeline (public activities only)
    let activities = [];
    try {
      const { data: activityData } = await supabase
        .from('grievance_activity_log')
        .select('*')
        .eq('grievance_id', grievanceId)
        .in('visibility', ['public', 'system'])
        .order('created_at', { ascending: true }); // Order by creation time for timeline
      
      activities = activityData || [];
    } catch (activityError) {
      console.log('Activity log not available:', activityError);
    }

    // Get notifications for this grievance
    let notifications = [];
    try {
      const { data: notificationData } = await supabase
        .from('notifications')
        .select('*')
        .contains('specific_users', [grievance.student_id])
        .contains('tags', ['grievance'])
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);
      
      notifications = notificationData || [];
    } catch (notifError) {
      console.log('Notifications not available:', notifError);
    }

    // Calculate status metrics
    const statusMetrics = {
      progress_percentage: calculateProgressPercentage(grievance.status),
      estimated_resolution: grievance.expected_resolution_date,
      time_since_created: Math.floor((new Date().getTime() - new Date(grievance.created_at).getTime()) / (1000 * 60 * 60)), // hours
      is_overdue: grievance.expected_resolution_date && 
        new Date(grievance.expected_resolution_date) < new Date() && 
        grievance.status !== 'resolved' && 
        grievance.status !== 'closed',
      last_update: grievance.updated_at,
      resolution_provided: !!grievance.resolution,
      total_activities: activities.length,
      admin_actions: activities.filter(a => a.actor_type === 'admin').length,
      milestones: activities.filter(a => a.is_milestone).length
    };

    // Get progress timeline
    const progressTimeline = buildProgressTimeline(grievance, activities);

    return NextResponse.json({
      success: true,
      data: {
        grievance,
        activities,
        notifications,
        status_metrics: statusMetrics,
        progress_timeline: progressTimeline,
        can_rate: grievance.status === 'resolved' && !grievance.resolution_rating
      }
    });

  } catch (error) {
    console.error('Get grievance details error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get grievance details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate progress percentage
function calculateProgressPercentage(status: string): number {
  switch (status) {
    case 'open': return 20;
    case 'in_progress': return 60;
    case 'resolved': return 90;
    case 'closed': return 100;
    default: return 0;
  }
}

// Helper function to build progress timeline
function buildProgressTimeline(grievance: {
  created_at: string;
  subject: string;
  status: string;
  resolution?: string;
  resolved_at?: string;
  updated_at: string;
  admin_users?: { name: string }[];
  assigned_to?: string;
}, activities: {
  id: string;
  activity_type: string;
  created_at: string;
  actor_name: string;
  actor_type: string;
  action_description: string;
  action_details?: Record<string, unknown>;
  is_milestone?: boolean;
}[]) {
  const timeline = [];

  // Step 1: Submitted
  timeline.push({
    step: 'submitted',
    title: 'GRIEVANCE SUBMITTED',
    status: 'completed',
    timestamp: grievance.created_at,
    description: `Grievance submitted: "${grievance.subject}"`,
    actor: 'Student',
    icon: 'file-text'
  });

  // Step 2: Assignment
  const assignmentActivity = activities.find(a => 
    a.activity_type === 'grievance_assigned' || a.activity_type === 'grievance_reassigned'
  );
  
  if (assignmentActivity) {
    timeline.push({
      step: 'assigned',
      title: 'ASSIGNED TO ADMIN',
      status: 'completed',
      timestamp: assignmentActivity.created_at,
      description: `Assigned to ${assignmentActivity.actor_name}`,
      actor: assignmentActivity.actor_name,
      icon: 'user-check',
      details: assignmentActivity.action_details
    });
  }

  // Step 3: In Progress
  const inProgressActivity = activities.find(a => 
    a.activity_type === 'grievance_status_changed' && 
    a.action_details?.new_status === 'in_progress'
  );
  
  if (inProgressActivity) {
    timeline.push({
      step: 'in_progress',
      title: 'IN PROGRESS',
      status: 'completed',
      timestamp: inProgressActivity.created_at,
      description: 'Admin started working on your grievance',
      actor: inProgressActivity.actor_name,
      icon: 'settings',
      details: inProgressActivity.action_details
    });
  }

  // Step 4: Admin Updates
  const updateActivities = activities.filter(a => 
    ['comment_added', 'grievance_priority_changed', 'admin_action_taken'].includes(a.activity_type)
  );

  updateActivities.forEach((activity) => {
    timeline.push({
      step: `update_${activity.id}`,
      title: getUpdateTitle(activity.activity_type),
      status: 'completed',
      timestamp: activity.created_at,
      description: activity.action_description,
      actor: activity.actor_name,
      icon: getUpdateIcon(activity.activity_type),
      details: activity.action_details
    });
  });

  // Step 5: Resolution
  const resolutionActivity = activities.find(a => a.activity_type === 'grievance_resolved');
  
  if (resolutionActivity || grievance.status === 'resolved') {
    timeline.push({
      step: 'resolved',
      title: 'GRIEVANCE RESOLVED',
      status: 'completed',
      timestamp: resolutionActivity?.created_at || grievance.resolved_at,
      description: grievance.resolution || 'Your grievance has been resolved',
      actor: resolutionActivity?.actor_name || 'Admin',
      icon: 'star',
      details: {
        resolution: grievance.resolution,
        ...resolutionActivity?.action_details
      },
      isResolution: true
    });
  }

  // Step 6: Closed
  const closedActivity = activities.find(a => a.activity_type === 'grievance_closed');
  
  if (closedActivity || grievance.status === 'closed') {
    timeline.push({
      step: 'closed',
      title: 'GRIEVANCE CLOSED',
      status: 'completed',
      timestamp: closedActivity?.created_at || grievance.updated_at,
      description: 'Grievance has been officially closed',
      actor: closedActivity?.actor_name || 'System',
      icon: 'x-circle'
    });
  }

  // Add current step if not resolved/closed
  if (!timeline.find(t => t.step === 'resolved' || t.step === 'closed')) {
    if (grievance.status === 'in_progress') {
      timeline.push({
        step: 'working',
        title: 'ADMIN WORKING',
        status: 'current',
        description: 'Admin is currently working on your grievance',
        actor: grievance.admin_users?.[0]?.name || 'Admin',
        icon: 'settings'
      });
    } else if (grievance.assigned_to) {
      timeline.push({
        step: 'pending_progress',
        title: 'PENDING REVIEW',
        status: 'current',
        description: 'Waiting for admin to start working',
        actor: grievance.admin_users?.[0]?.name || 'Admin',
        icon: 'clock'
      });
    } else {
      timeline.push({
        step: 'pending_assignment',
        title: 'PENDING ASSIGNMENT',
        status: 'current',
        description: 'Waiting to be assigned to an admin',
        icon: 'clock'
      });
    }
  }

  return timeline;
}

function getUpdateTitle(activityType: string): string {
  switch (activityType) {
    case 'comment_added':
      return 'ADMIN COMMENT';
    case 'grievance_priority_changed':
      return 'PRIORITY UPDATED';
    case 'admin_action_taken':
      return 'ADMIN ACTION';
    default:
      return 'UPDATE';
  }
}

function getUpdateIcon(activityType: string): string {
  switch (activityType) {
    case 'comment_added':
      return 'message-square';
    case 'grievance_priority_changed':
      return 'flag';
    case 'admin_action_taken':
      return 'settings';
    default:
      return 'activity';
  }
}

// POST endpoint to rate resolution or add feedback
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const grievanceId = resolvedParams.id;
    const body = await request.json();
    const { action, rating, feedback, student_id } = body;

    if (!grievanceId || !action || !student_id) {
      return NextResponse.json(
        { success: false, error: 'Grievance ID, action, and student ID are required' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Verify the grievance belongs to this student
    const { data: grievance, error: checkError } = await supabase
      .from('grievances')
      .select('student_id, status')
      .eq('id', grievanceId)
      .single();

    if (checkError || !grievance) {
      return NextResponse.json(
        { success: false, error: 'Grievance not found' },
        { status: 404 }
      );
    }

    if (grievance.student_id !== student_id) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to perform this action' },
        { status: 403 }
      );
    }

    if (action === 'rate_resolution') {
      if (grievance.status !== 'resolved') {
        return NextResponse.json(
          { success: false, error: 'Can only rate resolved grievances' },
          { status: 400 }
        );
      }

      // Update grievance with rating
      const { error: updateError } = await supabase
        .from('grievances')
        .update({
          resolution_rating: rating,
          resolution_feedback: feedback,
          rated_at: new Date().toISOString()
        })
        .eq('id', grievanceId);

      if (updateError) {
        throw updateError;
      }

      // Log the rating activity
      try {
        await supabase.rpc('log_grievance_activity', {
          p_grievance_id: grievanceId,
          p_activity_type: 'resolution_rated',
          p_visibility: 'system',
          p_actor_type: 'student',
          p_actor_id: student_id,
          p_actor_name: 'Student',
          p_action_description: `Resolution rated ${rating}/5 stars${feedback ? ' with feedback' : ''}`,
          p_action_details: {
            rating,
            feedback,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.log('Activity logging error:', logError);
      }

      return NextResponse.json({
        success: true,
        message: 'Thank you for rating the resolution!'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Grievance action error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 