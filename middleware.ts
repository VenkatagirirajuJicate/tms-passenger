import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protect driver routes
  if (pathname.startsWith('/driver') && pathname !== '/driver/login') {
    const driverUser = request.cookies.get('tms_driver_user');
    const driverToken = request.cookies.get('tms_driver_token');
    const driverSession = request.cookies.get('tms_driver_session');
    
    console.log('🔍 Middleware: Driver route accessed:', pathname);
    console.log('🔍 Middleware: Cookies found:', { 
      hasUser: !!driverUser, 
      hasToken: !!driverToken, 
      hasSession: !!driverSession 
    });
    
    if (!driverUser || !driverToken) {
      console.log('❌ Middleware: No driver authentication, redirecting to driver login');
      return NextResponse.redirect(new URL('/driver/login', request.url));
    }
    
    // Check if user is trying to access student routes while authenticated as driver
    if (pathname.startsWith('/driver') && (driverUser || driverToken)) {
      console.log('✅ Middleware: Driver authenticated, allowing access to driver routes');
      return NextResponse.next();
    }
  }
  
  // Protect student routes from driver access
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/test-payment-flow') || 
      pathname.startsWith('/demo-payment') ||
      pathname.startsWith('/test-auth') ||
      pathname.startsWith('/debug') ||
      (pathname === '/' && !pathname.startsWith('/driver'))) {
    
    const driverUser = request.cookies.get('tms_driver_user');
    const driverToken = request.cookies.get('tms_driver_token');
    const driverSession = request.cookies.get('tms_driver_session');
    
    // If driver cookies are present, redirect to driver app
    if (driverUser && driverToken) {
      console.log('🚗 Middleware: Driver detected trying to access student route, redirecting to driver app');
      return NextResponse.redirect(new URL('/driver', request.url));
    }
    
    console.log('✅ Middleware: Student route accessed, no driver interference detected');
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
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
