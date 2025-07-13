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

// GET - Get student's grievances with enhanced fields
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const grievanceType = searchParams.get('grievance_type');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    
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
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('grievances')
      .select(`
        *,
        routes (
          id,
          route_name,
          route_number,
          start_location,
          end_location
        ),
        admin_users!assigned_to (
          id,
          name,
          role,
          email
        ),
        grievance_communications (
          id,
          message,
          sender_type,
          sender_id,
          communication_type,
          read_at,
          created_at
        )
      `, { count: 'exact' })
      .eq('student_id', student.id);
    
    // Apply filters
    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    if (grievanceType) query = query.eq('grievance_type', grievanceType);
    if (priority) query = query.eq('priority', priority);
    
    // Apply search
    if (search) {
      query = query.or(`
        subject.ilike.%${search}%,
        description.ilike.%${search}%,
        driver_name.ilike.%${search}%,
        vehicle_registration.ilike.%${search}%
      `);
    }
    
    // Apply pagination and sorting
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching grievances:', error);
      return NextResponse.json({ error: 'Failed to fetch grievances' }, { status: 500 });
    }
    
    const totalPages = Math.ceil((count || 0) / limit);
    
    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    console.error('Error in GET /api/grievances:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Submit a new grievance with enhanced fields
export async function POST(request: NextRequest) {
  try {
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
      .select('id, student_name')
      .eq('email', userEmail)
      .single();
    
    if (studentError || !student) {
      console.error('Student lookup error:', studentError);
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    // Verify the student ID matches
    if (student.id !== studentId) {
      return NextResponse.json({ error: 'Unauthorized - Student ID mismatch' }, { status: 403 });
    }
    
    const {
      route_id,
      driver_name,
      vehicle_registration,
      category,
      grievance_type = 'service_complaint',
      priority = 'medium',
      urgency = 'medium',
      subject,
      description,
      location_details,
      incident_date,
      incident_time,
      witness_details,
      tags = [],
      attachments = []
    } = body;
    
    // Validate required fields
    if (!category || !subject || !description) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'Category, subject, and description are required'
      }, { status: 400 });
    }
    
    // Get configuration for this category to determine auto-assignment and SLA
    const { data: config, error: configError } = await supabase
      .from('grievance_categories_config')
      .select('*')
      .eq('category', category)
      .eq('grievance_type', grievance_type)
      .single();
    
    if (configError) {
      console.log('No specific config found for category, using defaults');
    }
    
    // Calculate estimated resolution time based on SLA
    const slaHours = config?.sla_hours || 72;
    const estimatedResolutionTime = `${slaHours} hours`;
    
    // Create the grievance with enhanced fields
    const grievanceData = {
      student_id: student.id,
      route_id: route_id || null,
      driver_name: driver_name || null,
      vehicle_registration: vehicle_registration || null,
      category,
      grievance_type,
      priority,
      urgency,
      subject: subject.trim(),
      description: description.trim(),
      location_details: location_details || null,
      incident_date: incident_date || null,
      incident_time: incident_time || null,
      witness_details: witness_details || null,
      tags: tags.length > 0 ? tags : null,
      attachments: attachments.length > 0 ? attachments : null,
      estimated_resolution_time: estimatedResolutionTime,
      status: 'open',
      assigned_to: config?.auto_assign_to || null // Auto-assign if configured
    };
    
    console.log('Attempting to create enhanced grievance with data:', grievanceData);
    
    const { data, error } = await supabase
      .from('grievances')
      .insert(grievanceData)
      .select(`
        *,
        routes (
          id,
          route_name,
          route_number,
          start_location,
          end_location
        ),
        admin_users!assigned_to (
          id,
          name,
          role,
          email
        )
      `)
      .single();
    
    if (error) {
      console.error('Error creating grievance:', error);
      return NextResponse.json({ 
        error: 'Failed to create grievance',
        details: error.message 
      }, { status: 500 });
    }
    
    // If auto-assigned, create assignment record
    if (data.assigned_to) {
      await supabase
        .from('grievance_assignments')
        .insert({
          grievance_id: data.id,
          assigned_to: data.assigned_to,
          assignment_reason: 'Auto-assigned based on category configuration',
          is_active: true
        });
      
      // Update status to in_progress if auto-assigned
      await supabase
        .from('grievances')
        .update({ status: 'in_progress' })
        .eq('id', data.id);
    }
    
    console.log('Successfully created enhanced grievance:', data);
    
    return NextResponse.json(data, { status: 201 });
    
  } catch (error) {
    console.error('Error in POST /api/grievances:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update grievance (for student ratings and feedback)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get current student from request headers
    const userEmail = request.headers.get('X-User-Email');
    const studentId = request.headers.get('X-Student-Id');
    
    if (!userEmail || !studentId) {
      return NextResponse.json({ error: 'Unauthorized - Missing session data' }, { status: 401 });
    }
    
    const { id, satisfaction_rating, feedback_on_resolution } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Grievance ID is required' }, { status: 400 });
    }
    
    const supabase = getServiceClient();
    
    // Verify the grievance belongs to the student
    const { data: grievance, error: grievanceError } = await supabase
      .from('grievances')
      .select('id, student_id, status')
      .eq('id', id)
      .eq('student_id', studentId)
      .single();
    
    if (grievanceError || !grievance) {
      return NextResponse.json({ error: 'Grievance not found or unauthorized' }, { status: 404 });
    }
    
    // Only allow rating if grievance is resolved
    if (grievance.status !== 'resolved') {
      return NextResponse.json({ error: 'Can only rate resolved grievances' }, { status: 400 });
    }
    
    const updateData: Record<string, unknown> = {};
    
    if (satisfaction_rating !== undefined) {
      if (satisfaction_rating < 1 || satisfaction_rating > 5) {
        return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
      }
      updateData.satisfaction_rating = satisfaction_rating;
    }
    
    if (feedback_on_resolution !== undefined) {
      updateData.feedback_on_resolution = feedback_on_resolution.trim();
    }
    
    const { data, error } = await supabase
      .from('grievances')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        routes (
          id,
          route_name,
          route_number,
          start_location,
          end_location
        ),
        admin_users!assigned_to (
          id,
          name,
          role,
          email
        )
      `)
      .single();
    
    if (error) {
      console.error('Error updating grievance:', error);
      return NextResponse.json({ error: 'Failed to update grievance' }, { status: 500 });
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error in PUT /api/grievances:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 