import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { findGuestByPhone, findGuestByEmail } from '@/lib/sheets';
import { sendOTP, OTP_CHANNEL, SKIP_OTP, signJWT } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { setSessionCookie } from '@/lib/session';

// Each schema validates only the field needed for the active channel.
// Extra fields in the body are ignored by zod (stripped by default).
const emailSchema = z.object({
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
});
const phoneSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
});

// Generic message used for both "not found" and validation errors to prevent
// guest-list enumeration (M1 — an attacker must not be able to distinguish
// a value that failed format validation from one that simply isn't on the list).
const NOT_FOUND_MSG =
  "We couldn't find you on our guest list. Please double-check or reach out to us directly.";

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  try {
    // Rate-limit by IP (10 per 15 min) to slow enumeration attempts.
    const ip = getClientIP(req);
    const ipLimit = checkRateLimit(`send-otp:ip:${ip}`, 10, 15 * 60);
    if (ipLimit.limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } }
      );
    }

    const body = await req.json();

    if (OTP_CHANNEL === 'email') {
      const parsed = emailSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: NOT_FOUND_MSG }, { status: 422 });
      }
      // Normalise at the route boundary so HMAC derivation and sheet lookups use the same key.
      const email = parsed.data.email.trim().toLowerCase();

      const emailLimit = checkRateLimit(`send-otp:email:${email}`, 3, 15 * 60);
      if (emailLimit.limited) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429, headers: { 'Retry-After': String(emailLimit.retryAfterSeconds) } }
        );
      }

      const guest = await findGuestByEmail(email);
      if (!guest) {
        return NextResponse.json({ error: NOT_FOUND_MSG }, { status: 422 });
      }

      if (SKIP_OTP) {
        const token = await signJWT({ name: guest.name, phone: guest.phone, email: guest.email });
        const res = NextResponse.json({ skipOtp: true });
        return setSessionCookie(res, token);
      }

      const { mock } = await sendOTP(email);
      return NextResponse.json({ ...(mock && { mock: true }) });
    }

    // sms / whatsapp
    const parsed = phoneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: NOT_FOUND_MSG }, { status: 422 });
    }
    const { phone } = parsed.data;

    // Rate-limit by phone (3 per 15 min) to prevent SMS-bombing a specific guest.
    const phoneLimit = checkRateLimit(`send-otp:phone:${phone}`, 3, 15 * 60);
    if (phoneLimit.limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(phoneLimit.retryAfterSeconds) } }
      );
    }

    const guest = await findGuestByPhone(phone);
    if (!guest) {
      return NextResponse.json({ error: NOT_FOUND_MSG }, { status: 422 });
    }

    if (SKIP_OTP) {
      const token = await signJWT({ name: guest.name, phone: guest.phone, email: guest.email });
      const res = NextResponse.json({ skipOtp: true });
      return setSessionCookie(res, token);
    }

    const { mock } = await sendOTP(phone);
    return NextResponse.json({ ...(mock && { mock: true }) });
  } catch (err) {
    console.error('[send-otp]', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
