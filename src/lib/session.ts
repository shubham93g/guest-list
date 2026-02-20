import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyJWT } from './jwt';
import type { SessionPayload } from '@/types';
import { SESSION_COOKIE, SESSION_EXPIRY_DAYS } from './constants';

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return verifyJWT(token);
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export function setSessionCookie(res: NextResponse, token: string): NextResponse {
  res.cookies.set(SESSION_COOKIE, token, {
    ...COOKIE_OPTIONS,
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
  });
  return res;
}

export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 });
  return res;
}
