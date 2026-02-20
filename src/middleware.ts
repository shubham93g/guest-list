import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { SESSION_COOKIE } from '@/lib/constants';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyJWT(token) : null;

  if (!session) {
    return NextResponse.redirect(new URL('/verify', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/welcome'],
};
