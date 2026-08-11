// Next.js automatically runs this file on every request matching `config.matcher`
// below — no import needed anywhere. It runs on the Edge runtime (before the page
// or API route executes), so jwt.ts must stay Edge-compatible (no Node.js-only APIs).
//
// Auth routing rules:
//   /login   + valid session → redirect to /invite or /flights, based on mode (see postLoginHref)
//   /invite  + no session    → redirect to /login  (or /login?mode=reception if mode param present)
//   /flights + no session    → redirect to /login?mode=flights
import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { SESSION_COOKIE, INVITE_MODE_PARAM, FLIGHTS_MODE, loginHref, postLoginHref } from '@/lib/constants';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyJWT(token) : null;
  const { pathname } = req.nextUrl;

  if (pathname === '/logout') {
    const res = NextResponse.redirect(new URL('/', req.url));
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  if (pathname === '/login' && session) {
    const mode = req.nextUrl.searchParams.get(INVITE_MODE_PARAM);
    return NextResponse.redirect(new URL(postLoginHref(mode), req.url));
  }

  if (pathname === '/invite' && !session) {
    const mode = req.nextUrl.searchParams.get(INVITE_MODE_PARAM);
    return NextResponse.redirect(new URL(loginHref(mode), req.url));
  }

  if (pathname === '/flights' && !session) {
    return NextResponse.redirect(new URL(loginHref(FLIGHTS_MODE), req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/invite', '/login', '/logout', '/flights'],
};
