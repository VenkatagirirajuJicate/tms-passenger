import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware to protect driver routes
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protect driver routes from non-driver access
  if (pathname.startsWith('/driver') && pathname !== '/driver/login') {
    // Check for driver authentication cookies
    const driverUser = request.cookies.get('tms_driver_user');
    const driverToken = request.cookies.get('tms_driver_token');
    const driverSession = request.cookies.get('tms_driver_session');
    
    console.log('🔍 Middleware: Driver route accessed:', pathname);
    console.log('🔍 Middleware: Cookies found:', { 
      hasUser: !!driverUser, 
      hasToken: !!driverToken, 
      hasSession: !!driverSession 
    });
    
    // If no driver authentication, redirect to driver login
    if (!driverUser || !driverToken) {
      console.log('❌ Middleware: No driver authentication, redirecting to driver login');
      return NextResponse.redirect(new URL('/driver/login', request.url));
    }
    
    try {
      // Parse and validate driver user data
      if (driverUser) {
        const driverData = JSON.parse(driverUser.value);
        
        // Check if user has driver role
        if (driverData.role !== 'driver') {
          console.log('❌ Middleware: User does not have driver role:', driverData.role);
          console.log('⚠️ Middleware: Redirecting to driver login due to insufficient role permissions');
          return NextResponse.redirect(new URL('/driver/login', request.url));
        }
      }
      
      // Check if session is expired (if session data exists)
      if (driverSession) {
        try {
          const sessionData = JSON.parse(driverSession.value);
          if (sessionData.expires_at && Date.now() > sessionData.expires_at) {
            console.log('❌ Middleware: Driver session expired');
            console.log('⚠️ Middleware: Redirecting to driver login due to expired session');
            return NextResponse.redirect(new URL('/driver/login', request.url));
          }
        } catch (error) {
          console.log('❌ Middleware: Invalid session data, redirecting to driver login');
          console.log('⚠️ Middleware: Redirecting to driver login due to corrupted session data');
          return NextResponse.redirect(new URL('/driver/login', request.url));
        }
      }
      
      // Check if token is expired (if token has expiration)
      if (driverToken && driverToken.value.includes('.')) {
        try {
          // Simple check for JWT token expiration
          const payload = JSON.parse(atob(driverToken.value.split('.')[1]));
          if (payload.exp && Date.now() > payload.exp * 1000) {
            console.log('❌ Middleware: Driver token expired');
            console.log('⚠️ Middleware: Redirecting to driver login due to expired token');
            return NextResponse.redirect(new URL('/driver/login', request.url));
          }
        } catch (error) {
          // If we can't parse the token, continue (it might not be a JWT)
          console.log('⚠️ Middleware: Could not parse token expiration, continuing with validation');
        }
      }
      
    } catch (error) {
      console.log('❌ Middleware: Invalid driver data, redirecting to driver login');
      console.log('⚠️ Middleware: Redirecting to driver login due to corrupted user data');
      return NextResponse.redirect(new URL('/driver/login', request.url));
    }
  }

  // Protect student/staff routes from driver access
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/test-payment-flow') || 
      pathname.startsWith('/demo-payment') ||
      pathname.startsWith('/test-auth') ||
      pathname.startsWith('/debug') ||
      (pathname === '/' && !pathname.startsWith('/driver'))) {
    
    const driverUser = request.cookies.get('tms_driver_user');
    const driverToken = request.cookies.get('tms_driver_token');
    const driverSession = request.cookies.get('tms_driver_session');
    
    // If driver cookies are present, redirect to main login with warning
    if (driverUser && driverToken) {
      console.log('🚗 Middleware: Driver detected trying to access student/staff route, redirecting to main login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.append('warning', 'driver_access_denied');
      return NextResponse.redirect(loginUrl);
    }
    
    // Additional enhancement: Check for valid student/staff authentication
    const studentToken = request.cookies.get('tms_access_token');
    const studentSession = request.cookies.get('tms_session');
    
    // For protected student/staff routes, ensure authentication exists
    if (pathname.startsWith('/dashboard') && (!studentToken && !studentSession)) {
      console.log('❌ Middleware: No student/staff authentication for protected route, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    console.log('✅ Middleware: Student/staff route accessed, no driver interference detected');
  }

  // Additional enhancement: Protect API routes
  if (pathname.startsWith('/api/driver/') && !pathname.includes('/login')) {
    const driverUser = request.cookies.get('tms_driver_user');
    const driverToken = request.cookies.get('tms_driver_token');
    
    if (!driverUser || !driverToken) {
      console.log('❌ Middleware: Unauthorized API access attempt to driver endpoint');
      return NextResponse.json(
        { error: 'Unauthorized: Driver authentication required' },
        { status: 401 }
      );
    }
    
    try {
      const driverData = JSON.parse(driverUser.value);
      if (driverData.role !== 'driver') {
        console.log('❌ Middleware: Non-driver trying to access driver API');
        return NextResponse.json(
          { error: 'Forbidden: Driver role required' },
          { status: 403 }
        );
      }
    } catch (error) {
      console.log('❌ Middleware: Invalid driver data for API access');
      return NextResponse.json(
        { error: 'Unauthorized: Invalid authentication data' },
        { status: 401 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/driver/:path*',
    '/dashboard/:path*',
    '/test-payment-flow/:path*',
    '/demo-payment/:path*',
    '/test-auth/:path*',
    '/debug/:path*',
    '/api/driver/:path*',
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
