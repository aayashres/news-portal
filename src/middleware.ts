import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  const publicPaths = ['/login', '/'];

  const authorPaths = ['/author'];

  const adminPaths = ['/admin'];

  const { pathname } = request.nextUrl;

  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);

    return NextResponse.redirect(loginUrl.toString());
  }

  try {
    // Check admin routes
    if (adminPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // Check author routes
    if (authorPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url).toString());
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
