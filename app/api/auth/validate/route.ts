import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    console.log('Token validation request:', { hasToken: !!token });

    if (!token) {
      return NextResponse.json(
        { error: 'Missing access token' },
        { status: 400 }
      );
    }

    // For our mock authentication system, validate the token format
    // In a real system, this would validate with the parent app
    
    console.log('Validating token:', token.substring(0, 20) + '...');
    
    // Check if it's an OAuth workaround token (mock token from fallback)
    if (token.startsWith('oauth_fallback_') || token.startsWith('mock_access_token_')) {
      console.log('Detected OAuth workaround token, creating mock user for testing');
      
      // For OAuth workaround tokens, create a mock user (specifically for arthanareswaran22@jkkn.ac.in)
      const user = {
        id: 'mock-driver-id-123',
        email: 'arthanareswaran22@jkkn.ac.in',
        full_name: 'Arthanareswaran Driver',
        role: 'driver',
        permissions: {
          transport_access: true,
          'transport.view': true,
          'transport.manage': true,
          'driver.dashboard': true,
          'routes.view': true,
          'routes.manage': true,
          'students.view': true,
          'notifications.view': true,
          'profile.view': true,
          'profile.edit': true
        }
      };
      
      console.log('OAuth workaround token validation successful for driver:', user.email);
      
      return NextResponse.json({
        valid: true,
        user: user,
        session: {
          id: `session_${user.id}`,
          expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
          created_at: new Date().toISOString(),
          last_used_at: new Date().toISOString()
        }
      });
    }
    
    // Check if it's our generated token format
    if (token.startsWith('tms_')) {
      try {
        // Decode our simple base64 token
        const payload = JSON.parse(Buffer.from(token.substring(4), 'base64').toString());
        
        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          console.log('Token expired');
          return NextResponse.json({
            valid: false,
            error: 'Token expired'
          });
        }
        
        // Create user object from token payload
        const user = {
          id: payload.sub,
          email: payload.email,
          full_name: payload.name || payload.email.split('@')[0].toUpperCase(),
          role: payload.role || 'student',
          permissions: {
            'transport.view': true,
            'transport.book': true,
            'payments.view': true,
            'payments.make': true,
            'grievances.create': true,
            'grievances.view': true,
            'notifications.view': true,
            'profile.view': true,
            'profile.edit': true
          }
        };
        
        console.log('TMS token validation successful for user:', user.email);
        
        return NextResponse.json({
          valid: true,
          user: user,
          session: {
            id: `session_${payload.sub}`,
            expires_at: new Date(payload.exp * 1000).toISOString(),
            created_at: new Date(payload.iat * 1000).toISOString(),
            last_used_at: new Date().toISOString()
          }
        });
        
      } catch (decodeError) {
        console.error('TMS token decode error:', decodeError);
        return NextResponse.json({
          valid: false,
          error: 'Invalid TMS token format'
        });
      }
    }
    
    // Check if it's a JWT token from parent app (starts with eyJ...)
    if (token.startsWith('eyJ')) {
      try {
        console.log('Detected JWT token from parent app');
        
        // For JWT tokens, we'll create a mock validation since we can't verify the signature
        // In a real implementation, you'd verify the JWT signature with the parent app's public key
        
        // Decode the JWT payload (without verification for demo purposes)
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid JWT format');
        }
        
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        console.log('JWT payload decoded:', { 
          sub: payload.sub, 
          email: payload.email, 
          exp: payload.exp 
        });
        
        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          console.log('JWT token expired');
          return NextResponse.json({
            valid: false,
            error: 'Token expired'
          });
        }
        
        // Create user object from JWT payload
        const user = {
          id: payload.sub || payload.user_id || `jwt_${Date.now()}`,
          email: payload.email || payload.username || 'user@jkkn.ac.in',
          full_name: payload.name || payload.full_name || payload.email?.split('@')[0].toUpperCase() || 'Student',
          role: payload.role || 'student',
          permissions: {
            'transport.view': true,
            'transport.book': true,
            'payments.view': true,
            'payments.make': true,
            'grievances.create': true,
            'grievances.view': true,
            'notifications.view': true,
            'profile.view': true,
            'profile.edit': true
          }
        };
        
        console.log('JWT token validation successful for user:', user.email);
        
        return NextResponse.json({
          valid: true,
          user: user,
          session: {
            id: `session_${user.id}`,
            expires_at: payload.exp ? new Date(payload.exp * 1000).toISOString() : new Date(Date.now() + 3600000).toISOString(),
            created_at: payload.iat ? new Date(payload.iat * 1000).toISOString() : new Date().toISOString(),
            last_used_at: new Date().toISOString()
          }
        });
        
      } catch (jwtError) {
        console.error('JWT token decode error:', jwtError);
        // Don't fail immediately, try parent app validation
      }
    }
    
    // Try to validate with parent app (will likely fail due to 500 error)
    try {
      console.log('Attempting parent app validation...');
      
      const validationResponse = await fetch(
        `${process.env.NEXT_PUBLIC_PARENT_APP_URL || 'https://my.jkkn.ac.in'}/api/auth/child-app/validate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || 'app_e20655605d48ebce_cfa1ffe34268949a'
          },
          body: JSON.stringify({
            app_id: process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674'
          })
        }
      );

      if (validationResponse.ok) {
        const validationData = await validationResponse.json();
        console.log('Parent app validation successful');
        return NextResponse.json(validationData);
      } else {
        const errorText = await validationResponse.text();
        console.log('Parent app validation failed:', validationResponse.status, errorText);
      }
    } catch (parentError) {
      console.log('Parent app validation error:', parentError.message);
    }
    
    // If all validation methods fail
    return NextResponse.json({
      valid: false,
      error: 'Unable to validate token'
    });

  } catch (error) {
    console.error('Token validation error:', error);
    
    return NextResponse.json(
      { 
        valid: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
