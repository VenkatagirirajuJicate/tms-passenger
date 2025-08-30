import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware to protect driver routes
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only apply to driver routes
  if (pathname.startsWith('/driver') && pathname !== '/driver/login') {
    // Check for driver authentication
    const driverToken = request.cookies.get('tms_driver_user');
    const driverSession = request.cookies.get('tms_driver_session');
    
    // If no driver authentication, redirect to login
    if (!driverToken || !driverSession) {
      return NextResponse.redirect(new URL('/driver/login', request.url));
    }
    
    try {
      // Parse and validate driver token
      const driverData = JSON.parse(driverToken.value);
      const sessionData = JSON.parse(driverSession.value);
      
      // Check if session is expired
      if (sessionData.expires_at && Date.now() > sessionData.expires_at) {
        return NextResponse.redirect(new URL('/driver/login', request.url));
      }
      
      // Check if user has driver role
      if (driverData.role !== 'driver') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
    } catch (error) {
      // Invalid token, redirect to login
      return NextResponse.redirect(new URL('/driver/login', request.url));
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
