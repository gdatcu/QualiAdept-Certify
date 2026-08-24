import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { getToken } from 'next-auth/jwt';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret =
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    'qualiadept-secret-key-2026';

  // Normalize path by stripping /en or /ro prefix for role checks
  const pathnameWithoutLocale = pathname.replace(/^\/(en|ro)(\/|$)/, '/');

  const isProtected =
    pathnameWithoutLocale.startsWith('/trainer') ||
    pathnameWithoutLocale.startsWith('/admin') ||
    pathnameWithoutLocale.startsWith('/assignment') ||
    pathnameWithoutLocale.startsWith('/leaderboard') ||
    pathname.startsWith('/api/validate/static');

  if (isProtected) {
    const token = await getToken({ req, secret });

    // Protect /trainer route (Strictly TRAINER role required)
    if (pathnameWithoutLocale.startsWith('/trainer')) {
      if (!token) {
        const loginUrl = new URL('/en', req.url);
        loginUrl.searchParams.set('error', 'Unauthenticated');
        return NextResponse.redirect(loginUrl);
      }

      if (token.role !== 'TRAINER') {
        const homeUrl = new URL('/en', req.url);
        homeUrl.searchParams.set('error', 'AccessDenied');
        return NextResponse.redirect(homeUrl);
      }
    }

    // Protect /admin route (Strictly isAdmin or TRAINER required)
    if (pathnameWithoutLocale.startsWith('/admin')) {
      if (!token) {
        const loginUrl = new URL('/en', req.url);
        loginUrl.searchParams.set('error', 'Unauthenticated');
        return NextResponse.redirect(loginUrl);
      }

      if (!token.isAdmin && token.role !== 'TRAINER') {
        const homeUrl = new URL('/en', req.url);
        homeUrl.searchParams.set('error', 'AccessDenied');
        return NextResponse.redirect(homeUrl);
      }
    }

    // Protect /assignment and /leaderboard routes (Authenticated session required)
    if (
      pathnameWithoutLocale.startsWith('/assignment') ||
      pathnameWithoutLocale.startsWith('/leaderboard')
    ) {
      if (!token) {
        const loginUrl = new URL('/en', req.url);
        loginUrl.searchParams.set('error', 'Unauthenticated');
        return NextResponse.redirect(loginUrl);
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
      return NextResponse.next();
    }
  }

  // Delegate UI page routes to next-intl middleware
  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)', '/api/validate/static'],
};
