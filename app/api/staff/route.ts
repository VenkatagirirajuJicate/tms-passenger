import { NextRequest, NextResponse } from 'next/server';

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  marital_status: string;
  blood_group: string;
  email: string;
  phone: string;
  staff_id: string;
  profile_picture: string;
  address: string;
  state: string;
  district: string;
  pincode: string;
  date_of_joining: string;
  designation: string;
  category_id: string;
  institution_id: string;
  department_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  institution_email: string;
  profile_id: string | null;
  category: {
    id: string;
    category_name: string;
  };
  institution: {
    id: string;
    name: string;
  };
  department: {
    id: string;
    department_name: string;
  };
}

interface StaffResponse {
  data: StaffMember[];
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching staff data from external API...');
    
    // Get the API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (!apiKey) {
      console.error('❌ API key not configured');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Fetch staff data from external API
    const response = await fetch('https://my.jkkn.ac.in/api/api-management/staff', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'Authorization': `Bearer ${apiKey}` // Some APIs require this format
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000) // 10 seconds timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ External API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch staff data from external API',
          details: errorText,
          status: response.status
        },
        { status: response.status }
      );
    }

    const staffData: StaffResponse = await response.json();
    
    console.log('✅ Staff data fetched successfully:', {
      totalStaff: staffData.data?.length || 0,
      sampleStaff: staffData.data?.[0]?.email || 'No staff found'
    });

    // Transform the data to match our internal format
    const transformedStaff = staffData.data?.map(staff => ({
      id: staff.id,
      email: staff.email,
      full_name: `${staff.first_name} ${staff.last_name}`.trim(),
      first_name: staff.first_name,
      last_name: staff.last_name,
      phone: staff.phone,
      staff_id: staff.staff_id,
      designation: staff.designation,
      department: staff.department.department_name,
      category: staff.category.category_name,
      institution: staff.institution.name,
      is_active: staff.is_active,
      date_of_joining: staff.date_of_joining,
      profile_picture: staff.profile_picture,
      address: staff.address,
      state: staff.state,
      district: staff.district,
      pincode: staff.pincode,
      blood_group: staff.blood_group,
      gender: staff.gender,
      marital_status: staff.marital_status,
      date_of_birth: staff.date_of_birth,
      created_at: staff.created_at,
      updated_at: staff.updated_at
    })) || [];

    return NextResponse.json({
      success: true,
      staff: transformedStaff,
      total: transformedStaff.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching staff data:', error);
    
    let errorMessage = 'Failed to fetch staff data';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        errorMessage = 'Request timeout - external API took too long to respond';
        statusCode = 408;
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error - unable to connect to external API';
        statusCode = 503;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}

// POST method to create or update staff member (if needed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, staffData } = body;

    if (action === 'sync') {
      // Trigger a sync with external API
      console.log('🔄 Syncing staff data with external API...');
      
      // For now, just return success - in production you might want to implement sync logic
      return NextResponse.json({
        success: true,
        message: 'Staff sync initiated',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: 'Invalid action specified' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Error in staff POST endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

