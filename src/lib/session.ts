import { cookies } from 'next/headers';
import { verifyJWT } from './jwt';
import type { SessionPayload } from '@/types';
import { SESSION_COOKIE } from './constants';

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return verifyJWT(token);
}
