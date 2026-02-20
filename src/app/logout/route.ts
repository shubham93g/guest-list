import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/session';

export async function GET(req: NextRequest) {
  return clearSessionCookie(NextResponse.redirect(new URL('/', req.url)));
}
