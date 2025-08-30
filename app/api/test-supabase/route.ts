import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('drivers')
      .select('id, name')
      .limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      data: data,
      config: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
      }
    });

  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to connect to Supabase',
      details: error
    }, { status: 500 });
  }
}


