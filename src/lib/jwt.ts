import { SignJWT, jwtVerify } from 'jose';
import type { SessionPayload } from '@/types';
import { SESSION_EXPIRY_DAYS } from './constants';

function getJWTSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET!);
}

export async function signJWT(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRY_DAYS}d`)
    .sign(getJWTSecret());
}

export async function verifyJWT(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJWTSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
