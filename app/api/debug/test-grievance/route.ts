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

export async function GET() {
  try {
    const supabase = getServiceClient();
    
    // Test basic database connectivity
    const { error: tablesError } = await supabase
      .from('grievances')
      .select('*', { count: 'exact', head: true });
    
    if (tablesError) {
      return NextResponse.json({
        status: 'error',
        message: 'Database connection failed',
        error: tablesError
      }, { status: 500 });
    }
    
    // Test grievance categories table
    const { data: categories, error: categoriesError } = await supabase
      .from('grievance_categories_config')
      .select('*')
      .limit(1);
    
    // Test students table
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, email')
      .limit(1);
    
    return NextResponse.json({
      status: 'success',
      message: 'Grievance system test completed',
      tests: {
        grievancesTable: {
          accessible: !tablesError,
          error: tablesError ? (tablesError as Record<string, unknown>).message || 'Unknown error' : null
        },
        categoriesTable: {
          accessible: !categoriesError,
          count: categories?.length || 0,
          error: categoriesError?.message || null
        },
        studentsTable: {
          accessible: !studentsError,
          count: students?.length || 0,
          error: studentsError?.message || null
        }
      },
      environment: {
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 