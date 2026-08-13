import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'qualiadept-secret-key-2026';

  const token = await getToken({ req, secret });

  // Protect /trainer route (Strictly TRAINER role required)
  if (pathname.startsWith('/trainer')) {
    if (!token) {
      const loginUrl = new URL('/', req.url);
      loginUrl.searchParams.set('error', 'Unauthenticated');
      return NextResponse.redirect(loginUrl);
    }

    if (token.role !== 'TRAINER') {
      const homeUrl = new URL('/', req.url);
      homeUrl.searchParams.set('error', 'AccessDenied');
      return NextResponse.redirect(homeUrl);
    }
  }

  // Protect /assignment route (Strictly Enrolled or TRAINER required)
  if (pathname.startsWith('/assignment') || pathname.startsWith('/leaderboard')) {
    if (!token) {
      const loginUrl = new URL('/', req.url);
      loginUrl.searchParams.set('error', 'Unauthenticated');
      return NextResponse.redirect(loginUrl);
    }

    if (token.role !== 'TRAINER' && !token.isEnrolled) {
      const enrollUrl = new URL('/enroll', req.url);
      return NextResponse.redirect(enrollUrl);
    }
  }

  // Protect /api/validate/static route (Authenticated session required)
  if (pathname.startsWith('/api/validate/static')) {
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: Please sign in with GitHub to submit code.' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/trainer/:path*', '/assignment/:path*', '/leaderboard/:path*', '/api/validate/static'],
};
