import { createClient } from '@supabase/supabase-js';

/**
 * Create Supabase client with environment variable fallback
 * Tries service role key first (bypasses RLS), falls back to anon key
 */
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
    throw new Error('Missing Supabase environment variables - need URL and at least one API key');
  }
  
  // Use service role key if available (bypasses RLS), otherwise use anon key
  const supabaseKey = supabaseServiceKey || supabaseAnonKey;
  const keyType = supabaseServiceKey ? 'service_role' : 'anon';
  
  console.log(`🔑 Using Supabase key type: ${keyType} for API request`);
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

/**
 * Get Supabase client info for debugging
 */
export const getSupabaseConfig = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return {
    hasUrl: !!supabaseUrl,
    hasServiceKey,
    hasAnonKey,
    recommendedKey: hasServiceKey ? 'service_role' : hasAnonKey ? 'anon' : 'none'
  };
};







