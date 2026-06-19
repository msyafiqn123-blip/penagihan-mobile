import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Next.js Edge middleware doesn't support jsonwebtoken well, but we can decode it manually if needed,
  // or we just assume token presence is enough for route guarding, and let the page/API validate it fully.
  // Actually, since jsonwebtoken uses Node crypto, it fails in Edge runtime. 
  // For basic protection, we'll just check if the token cookie exists.
  // Actual validation happens in Server Components or API routes where Node runtime is available.

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
};
