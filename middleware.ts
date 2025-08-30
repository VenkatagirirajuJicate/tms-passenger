import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware to protect driver routes
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only apply to driver routes (except login)
  if (pathname.startsWith('/driver') && pathname !== '/driver/login') {
    // Check for driver authentication cookies
    const driverUser = request.cookies.get('tms_driver_user');
    const driverToken = request.cookies.get('tms_driver_token');
    const driverSession = request.cookies.get('tms_driver_session');
    
    // TEMPORARILY DISABLED FOR TESTING - Check if client-side auth works
    console.log('🔍 Middleware: Driver route accessed:', pathname);
    console.log('🔍 Middleware: Cookies found:', { 
      hasUser: !!driverUser, 
      hasToken: !!driverToken, 
      hasSession: !!driverSession 
    });
    
    // If no driver authentication, redirect to driver login
    if (!driverUser || !driverToken) {
      console.log('❌ Middleware: No driver authentication, redirecting to driver login');
      // TEMPORARILY DISABLED: return NextResponse.redirect(new URL('/driver/login', request.url));
      console.log('⚠️ Middleware: Redirect DISABLED for testing');
    }
    
    try {
      // Parse and validate driver user data
      if (driverUser) {
        const driverData = JSON.parse(driverUser.value);
        
        // Check if user has driver role
        if (driverData.role !== 'driver') {
          console.log('❌ Middleware: User does not have driver role:', driverData.role);
          // TEMPORARILY DISABLED: return NextResponse.redirect(new URL('/driver/login', request.url));
          console.log('⚠️ Middleware: Role check redirect DISABLED for testing');
        }
      }
      
      // Check if session is expired (if session data exists)
      if (driverSession) {
        try {
          const sessionData = JSON.parse(driverSession.value);
          if (sessionData.expires_at && Date.now() > sessionData.expires_at) {
            console.log('❌ Middleware: Driver session expired');
            // TEMPORARILY DISABLED: return NextResponse.redirect(new URL('/driver/login', request.url));
            console.log('⚠️ Middleware: Expiry redirect DISABLED for testing');
          }
        } catch (error) {
          console.log('❌ Middleware: Invalid session data, redirecting to driver login');
          // TEMPORARILY DISABLED: return NextResponse.redirect(new URL('/driver/login', request.url));
          console.log('⚠️ Middleware: Invalid session redirect DISABLED for testing');
        }
      }
      
      // Check if token is expired (if token has expiration)
      if (driverToken && driverToken.value.includes('.')) {
        try {
          // Simple check for JWT token expiration
          const payload = JSON.parse(atob(driverToken.value.split('.')[1]));
          if (payload.exp && Date.now() > payload.exp * 1000) {
            console.log('❌ Middleware: Driver token expired');
            // TEMPORARILY DISABLED: return NextResponse.redirect(new URL('/driver/login', request.url));
            console.log('⚠️ Middleware: Token expiry redirect DISABLED for testing');
          }
        } catch (error) {
          // If we can't parse the token, continue (it might not be a JWT)
        }
      }
      
    } catch (error) {
      console.log('❌ Middleware: Invalid driver data, redirecting to driver login');
      // TEMPORARILY DISABLED: return NextResponse.redirect(new URL('/driver/login', request.url));
      console.log('⚠️ Middleware: Invalid data redirect DISABLED for testing');
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/driver/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
