import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Простая проверка cookie вместо getIronSession в Edge Runtime
function isAuthenticated(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get('ornek_session');
  return !!sessionCookie?.value;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated(request)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Redirect logged-in users from login/register to dashboard
  if (pathname === '/login' || pathname === '/register') {
    if (isAuthenticated(request)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
