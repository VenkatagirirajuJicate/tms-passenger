import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    
    // Get the grievance categories configuration
    const { data: categoriesConfig, error: configError } = await supabase
      .from('grievance_categories_config')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (configError) {
      console.error('Error fetching categories config:', configError);
      return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 });
    }

    // Log the fetched categories config for debugging
    console.log('Fetched grievance categories config:', categoriesConfig?.length || 0, 'items');

    const config = {
      categories: {
        complaint: {
          label: 'Complaint',
          description: 'Issues or problems with transport services',
          types: [
            { value: 'service_complaint', label: 'Service Complaint' },
            { value: 'driver_behavior', label: 'Driver Behavior' },
            { value: 'route_issue', label: 'Route Issue' },
            { value: 'vehicle_condition', label: 'Vehicle Condition' },
            { value: 'safety_concern', label: 'Safety Concern' },
            { value: 'billing_dispute', label: 'Billing Dispute' }
          ]
        },
        suggestion: {
          label: 'Suggestion',
          description: 'Ideas for improving transport services',
          types: [
            { value: 'suggestion', label: 'General Suggestion' }
          ]
        },
        compliment: {
          label: 'Compliment',
          description: 'Positive feedback about transport services',
          types: [
            { value: 'compliment', label: 'General Compliment' }
          ]
        },
        technical_issue: {
          label: 'Technical Issue',
          description: 'Problems with the transport booking system',
          types: [
            { value: 'technical_issue', label: 'Technical Issue' }
          ]
        }
      },
      priorities: [
        { value: 'low', label: 'Low', description: 'Non-urgent issues' },
        { value: 'medium', label: 'Medium', description: 'Standard priority' },
        { value: 'high', label: 'High', description: 'Important issues' },
        { value: 'urgent', label: 'Urgent', description: 'Critical issues requiring immediate attention' }
      ],
      urgency: [
        { value: 'low', label: 'Low', description: 'Can wait for resolution' },
        { value: 'medium', label: 'Medium', description: 'Should be addressed soon' },
        { value: 'high', label: 'High', description: 'Needs prompt attention' },
        { value: 'critical', label: 'Critical', description: 'Immediate action required' }
      ]
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error in GET /api/grievances/config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 