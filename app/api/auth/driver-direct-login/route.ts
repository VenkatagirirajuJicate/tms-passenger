import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, app_id, api_key } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate app credentials
    const expectedAppId = process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674';
    const expectedApiKey = process.env.NEXT_PUBLIC_API_KEY || 'app_e20655605d48ebce_cfa1ffe34268949a';

    if (app_id !== expectedAppId || api_key !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Invalid app credentials' },
        { status: 401 }
      );
    }

    console.log('Driver direct login attempt:', { email, hasPassword: !!password });

    // Try to authenticate with parent app first
    let parentUser = null;
    let useParentAuth = false;

    try {
      console.log('🔄 Attempting driver authentication with parent app...');
      
      const parentAuthResponse = await fetch(
        `${process.env.NEXT_PUBLIC_PARENT_APP_URL || 'https://my.jkkn.ac.in'}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': expectedApiKey,
            'User-Agent': 'TMS-Driver-App/1.0'
          },
          body: JSON.stringify({
            email,
            password,
            app_id: expectedAppId
          }),
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(10000) // 10 second timeout
        }
      );

      if (parentAuthResponse.ok) {
        const parentData = await parentAuthResponse.json();
        parentUser = parentData.user;

        // Enhanced role debugging for driver direct login
        console.log('🔍 Driver Direct Login - Detailed user info from parent app:', {
          email: parentUser?.email,
          role: parentUser?.role,
          fullName: parentUser?.full_name,
          permissions: parentUser?.permissions,
          is_driver: parentUser?.is_driver,
          allUserData: parentUser
        });

        // Validate that the authenticated user has driver role - enhanced checking
        const hasDriverRole = parentUser && (
          parentUser.role === 'driver' ||
          parentUser.role === 'transport_staff' ||
          parentUser.role === 'staff' ||
          parentUser.role === 'employee' ||
          parentUser.role === 'transport_employee' ||
          parentUser.role === 'transport' ||
          parentUser.is_driver ||
          (parentUser.permissions && parentUser.permissions.transport_access) ||
          (typeof parentUser.role === 'string' && parentUser.role.toLowerCase().includes('driver')) ||
          (typeof parentUser.role === 'string' && parentUser.role.toLowerCase().includes('transport'))
        );

        if (hasDriverRole) {
          console.log('✅ Parent app authentication successful for driver - role validated:', parentUser.email);
          useParentAuth = true;
        } else {
          console.log('❌ Parent app user does not have driver role - detailed info:', {
            role: parentUser?.role,
            roleType: typeof parentUser?.role,
            checkedRoles: ['driver', 'transport_staff', 'staff', 'employee', 'transport_employee', 'transport'],
            permissions: parentUser?.permissions,
            is_driver: parentUser?.is_driver,
            fullUserData: JSON.stringify(parentUser, null, 2)
          });
          parentUser = null;
        }
      } else {
        const errorText = await parentAuthResponse.text();
        console.log('❌ Parent app authentication failed:', {
          status: parentAuthResponse.status,
          error: errorText
        });
      }
    } catch (parentError) {
      console.warn('⚠️ Parent app authentication failed:', parentError);
      
      // Check if it's the specific confirmation_token error
      const errorMessage = parentError instanceof Error ? parentError.message : String(parentError);
      if (errorMessage.includes('confirmation_token') || errorMessage.includes('converting NULL to string')) {
        console.error('🔴 Parent app database error detected (confirmation_token NULL issue)');
        console.log('💡 This is a known issue with the parent app database schema');
        console.log('💡 The parent app needs to fix NULL values in the confirmation_token column');
        console.log('💡 Falling back to local driver authentication...');
      }
      
      // Continue with local authentication regardless of parent app issues
    }

    // If parent auth failed or user doesn't have driver role, try local database
    if (!useParentAuth) {
      console.log('🔄 Attempting local database driver authentication...');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json(
          { error: 'Authentication service unavailable' },
          { status: 503 }
        );
      }

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      // Find driver by email in local database
      const { data: driver, error: driverError } = await supabaseAdmin
        .from('drivers')
        .select('*')
        .eq('email', email)
        .single();

      if (driverError || !driver) {
        return NextResponse.json(
          { error: 'Invalid credentials. Please check your email and password.' },
          { status: 401 }
        );
      }

      // Check if driver account is active
      if (driver.status && driver.status !== 'active') {
        return NextResponse.json(
          { error: 'Driver account is not active. Contact administration.' },
          { status: 403 }
        );
      }

      // Verify password
      const passwordHash: string | null = driver.password_hash || null;
      if (!passwordHash) {
        return NextResponse.json(
          { error: 'Password not set for this driver account' },
          { status: 400 }
        );
      }

      const isPasswordValid = await bcrypt.compare(password, passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Invalid credentials. Please check your email and password.' },
          { status: 401 }
        );
      }

      // Create driver session from local database
      console.log('✅ Local database driver authentication successful:', driver.email);

      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      
      const session = {
        access_token: `driver-direct-${driver.id}-${Date.now()}`,
        refresh_token: `driver-refresh-${driver.id}-${Date.now()}`,
        expires_at: expiresAt
      };

      const user = {
        id: driver.id as string,
        email: driver.email as string,
        role: 'driver',
        user_metadata: {
          driver_id: driver.id as string,
          driver_name: (driver.name as string) || 'Driver'
        }
      };

      return NextResponse.json({
        success: true,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: 24 * 3600, // 24 hours in seconds
        token_type: 'Bearer',
        user,
        session,
        driver: {
          id: driver.id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          rating: driver.rating ?? 0
        },
        message: 'Driver authentication successful'
      });
    }

    // Handle parent app authentication success
    if (useParentAuth && parentUser) {
      console.log('✅ Using parent app authentication for driver');

      // Check if we have driver details in local database
      let localDriverData = null;
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseServiceKey) {
          const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
          });

          const { data: driver } = await supabaseAdmin
            .from('drivers')
            .select('*')
            .eq('email', email)
            .single();

          if (driver) {
            localDriverData = {
              id: driver.id,
              name: driver.name,
              email: driver.email,
              phone: driver.phone,
              rating: driver.rating ?? 0
            };
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch local driver data:', error);
      }

      // Generate JWT-like token for consistency
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      
      const session = {
        access_token: `driver-parent-${parentUser.id}-${Date.now()}`,
        refresh_token: `driver-parent-refresh-${parentUser.id}-${Date.now()}`,
        expires_at: expiresAt
      };

      const user = {
        id: parentUser.id,
        email: parentUser.email,
        full_name: parentUser.full_name || parentUser.name,
        role: 'driver',
        user_metadata: {
          driver_id: localDriverData?.id || parentUser.id,
          driver_name: localDriverData?.name || parentUser.full_name || parentUser.name || 'Driver'
        }
      };

      return NextResponse.json({
        success: true,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: 24 * 3600, // 24 hours in seconds
        token_type: 'Bearer',
        user,
        session,
        driver: localDriverData || {
          id: parentUser.id,
          name: parentUser.full_name || parentUser.name,
          email: parentUser.email,
          phone: parentUser.phone_number,
          rating: 0
        },
        message: 'Driver authentication successful via parent app'
      });
    }

    // This should not happen, but fallback
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );

  } catch (error) {
    console.error('Driver direct login error:', error);
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json(
      { error: 'Authentication service error: ' + message },
      { status: 500 }
    );
  }
}
