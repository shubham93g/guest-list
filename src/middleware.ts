// Next.js automatically runs this file on every request matching `config.matcher`
// below — no import needed anywhere. It runs on the Edge runtime (before the page
// or API route executes), so jwt.ts must stay Edge-compatible (no Node.js-only APIs).
//
// Auth routing rules:
//   /verify  + valid session → redirect to /welcome (skip unnecessary re-auth)
//   /welcome + no session    → redirect to /verify
import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { SESSION_COOKIE } from '@/lib/constants';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyJWT(token) : null;
  const { pathname } = req.nextUrl;

  if (pathname === '/verify' && session) {
    return NextResponse.redirect(new URL('/welcome', req.url));
  }

  if (pathname === '/welcome' && !session) {
    return NextResponse.redirect(new URL('/verify', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/welcome', '/verify'],
};
