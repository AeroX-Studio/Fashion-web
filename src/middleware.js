import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Protect /admin routes (except /admin/login if separate)
  if (pathname.startsWith('/admin')) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || 'priyo-collection-secret-key-change-in-production-2026',
    });

    if (!token || token.userType !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('callbackUrl', encodeURI(req.url));
      return NextResponse.redirect(url);
    }
  }

  // Protect /account routes
  if (pathname.startsWith('/account')) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET || 'priyo-collection-secret-key-change-in-production-2026',
    });

    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('callbackUrl', encodeURI(req.url));
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
};
