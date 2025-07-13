import { NextRequest, NextResponse } from 'next/server';
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

// GET - Get all communications for a grievance (student view)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: grievanceId } = await params;
    
    // Get current student from request headers
    const userEmail = request.headers.get('X-User-Email');
    const studentId = request.headers.get('X-Student-Id');
    
    if (!userEmail || !studentId) {
      return NextResponse.json({ error: 'Unauthorized - Missing session data' }, { status: 401 });
    }

    const supabase = getServiceClient();
    
    // Verify the grievance belongs to the student
    const { data: grievance, error: grievanceError } = await supabase
      .from('grievances')
      .select('id, student_id')
      .eq('id', grievanceId)
      .eq('student_id', studentId)
      .single();

    if (grievanceError || !grievance) {
      return NextResponse.json({ error: 'Grievance not found or unauthorized' }, { status: 404 });
    }

    // Get communications for this grievance (excluding internal ones)
    const { data, error } = await supabase
      .from('grievance_communications')
      .select('*')
      .eq('grievance_id', grievanceId)
      .eq('is_internal', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching grievance communications:', error);
      return NextResponse.json({ error: 'Failed to fetch communications' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/grievances/[id]/communications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add new communication to a grievance (student comment)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: grievanceId } = await params;
    const body = await request.json();
    
    // Get current student from request headers
    const userEmail = request.headers.get('X-User-Email');
    const studentId = request.headers.get('X-Student-Id');
    
    if (!userEmail || !studentId) {
      return NextResponse.json({ error: 'Unauthorized - Missing session data' }, { status: 401 });
    }

    const supabase = getServiceClient();
    
    // Verify the grievance belongs to the student
    const { data: grievance, error: grievanceError } = await supabase
      .from('grievances')
      .select('id, student_id, assigned_to')
      .eq('id', grievanceId)
      .eq('student_id', studentId)
      .single();

    if (grievanceError || !grievance) {
      return NextResponse.json({ error: 'Grievance not found or unauthorized' }, { status: 404 });
    }

    const { message, attachments = [] } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Determine recipient (assigned admin or default to first admin)
    let recipientId = grievance.assigned_to;
    if (!recipientId) {
      const { data: defaultAdmin } = await supabase
        .from('admin_users')
        .select('id')
        .eq('role', 'operations_admin')
        .limit(1)
        .single();
      
      recipientId = defaultAdmin?.id;
    }

    if (!recipientId) {
      return NextResponse.json({ error: 'No admin available to receive message' }, { status: 500 });
    }

    // Create the communication
    const { data, error } = await supabase
      .from('grievance_communications')
      .insert({
        grievance_id: grievanceId,
        sender_id: studentId,
        sender_type: 'student',
        recipient_id: recipientId,
        recipient_type: 'admin',
        message: message.trim(),
        communication_type: 'comment',
        is_internal: false,
        attachments
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating communication:', error);
      return NextResponse.json({ error: 'Failed to create communication' }, { status: 500 });
    }

    // Update grievance's updated_at timestamp
    await supabase
      .from('grievances')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', grievanceId);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/grievances/[id]/communications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Mark communication as read (student side)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: grievanceId } = await params;
    const body = await request.json();
    
    // Get current student from request headers
    const userEmail = request.headers.get('X-User-Email');
    const studentId = request.headers.get('X-Student-Id');
    
    if (!userEmail || !studentId) {
      return NextResponse.json({ error: 'Unauthorized - Missing session data' }, { status: 401 });
    }

    const { communication_id } = body;

    if (!communication_id) {
      return NextResponse.json({ error: 'Communication ID is required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Verify the grievance belongs to the student
    const { data: grievance, error: grievanceError } = await supabase
      .from('grievances')
      .select('id, student_id')
      .eq('id', grievanceId)
      .eq('student_id', studentId)
      .single();

    if (grievanceError || !grievance) {
      return NextResponse.json({ error: 'Grievance not found or unauthorized' }, { status: 404 });
    }

    // Mark communication as read
    const { data, error } = await supabase
      .from('grievance_communications')
      .update({ 
        read_at: new Date().toISOString(),
        read_by: studentId
      })
      .eq('id', communication_id)
      .eq('grievance_id', grievanceId)
      .eq('recipient_type', 'student')
      .select()
      .single();

    if (error) {
      console.error('Error marking communication as read:', error);
      return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/grievances/[id]/communications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 