import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sessionManager } from '@/lib/session';

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

// GET - Get comments for a grievance
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    // Get current student from session
    const session = sessionManager.getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = getServiceClient();
    
    // Get student data
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('email', session.user.email)
      .single();
    
    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    // Verify student owns this grievance
    const { data: grievance, error: grievanceError } = await supabase
      .from('grievances')
      .select('id')
      .eq('id', id)
      .eq('student_id', student.id)
      .single();
    
    if (grievanceError || !grievance) {
      return NextResponse.json({ error: 'Grievance not found' }, { status: 404 });
    }
    
    // Get communications (excluding internal ones)
    const { data: communications, error } = await supabase
      .from('grievance_communications')
      .select(`
        *,
        admin_users!sender_id (
          id,
          name,
          email
        )
      `)
      .eq('grievance_id', id)
      .eq('is_internal', false)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching communications:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
    
    // Add sender info for student messages
    const processedCommunications = communications.map(comm => {
      if (comm.sender_type === 'student') {
        return {
          ...comm,
          sender_name: 'You',
          sender_email: session.user.email
        };
      } else {
        return {
          ...comm,
          sender_name: comm.admin_users?.name || 'Admin',
          sender_email: comm.admin_users?.email || ''
        };
      }
    });
    
    return NextResponse.json(processedCommunications);
    
  } catch (error) {
    console.error('Error in GET /api/grievances/[id]/comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add a comment/communication to grievance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const grievanceId = resolvedParams.id;
    const body = await request.json();
    
    // Get current student from request headers
    const userEmail = request.headers.get('X-User-Email');
    const studentId = request.headers.get('X-Student-Id');
    
    if (!userEmail || !studentId) {
      return NextResponse.json({ error: 'Unauthorized - Missing session data' }, { status: 401 });
    }
    
    const supabase = getServiceClient();
    
    // Get student data
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('email', userEmail)
      .single();
    
    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    // Verify the student ID matches
    if (student.id !== studentId) {
      return NextResponse.json({ error: 'Unauthorized - Student ID mismatch' }, { status: 403 });
    }
    
    // Verify grievance belongs to student
    const { data: grievance, error: grievanceError } = await supabase
      .from('grievances')
      .select('id, status, assigned_to')
      .eq('id', grievanceId)
      .eq('student_id', student.id)
      .single();
    
    if (grievanceError || !grievance) {
      return NextResponse.json({ error: 'Grievance not found' }, { status: 404 });
    }
    
    // Don't allow comments on closed grievances
    if (grievance.status === 'closed') {
      return NextResponse.json({ 
        error: 'Cannot add comments to closed grievance' 
      }, { status: 400 });
    }
    
    const { message, communication_type = 'comment' } = body;
    
    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    // Create the communication
    const { data: communication, error } = await supabase
      .from('grievance_communications')
      .insert({
        grievance_id: grievanceId,
        sender_type: 'student',
        sender_id: student.id,
        recipient_type: 'admin',
        recipient_id: grievance.assigned_to,
        message: message.trim(),
        communication_type,
        is_internal: false
      })
      .select('*')
      .single();
    
    if (error) {
      console.error('Error creating communication:', error);
      return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
    }
    
    return NextResponse.json(communication, { status: 201 });
    
  } catch (error) {
    console.error('Error in POST /api/grievances/[id]/comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Mark comment as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { communication_id } = body;
    
    if (!communication_id) {
      return NextResponse.json({ error: 'Communication ID is required' }, { status: 400 });
    }
    
    // Get current student from session
    const session = sessionManager.getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get student data
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('email', session.user.email)
      .single();
    
    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    // Verify student owns this grievance
    const { data: grievance, error: grievanceError } = await supabase
      .from('grievances')
      .select('id')
      .eq('id', id)
      .eq('student_id', student.id)
      .single();
    
    if (grievanceError || !grievance) {
      return NextResponse.json({ error: 'Grievance not found' }, { status: 404 });
    }
    
    // Mark communication as read
    const { data, error } = await supabase
      .from('grievance_communications')
      .update({
        read_at: new Date().toISOString()
      })
      .eq('id', communication_id)
      .eq('grievance_id', id)
      .eq('recipient_type', 'student')
      .eq('recipient_id', student.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating communication:', error);
      return NextResponse.json({ error: 'Failed to mark comment as read' }, { status: 500 });
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error in PATCH /api/grievances/[id]/comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 