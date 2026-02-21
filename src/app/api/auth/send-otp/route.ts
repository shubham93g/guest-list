import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { findGuestByPhone } from '@/lib/sheets';
import { sendOTP } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

const schema = z.object({
  phone: z.string().regex(PHONE_REGEX, 'Please enter a valid phone number.'),
});

// Generic message used for both "not found" and validation errors to prevent
// guest-list enumeration (M1 — an attacker must not be able to distinguish
// a phone that failed format validation from one that simply isn't on the list).
const NOT_FOUND_MSG =
  "We couldn't find your number on our guest list. Please double-check or reach out to us directly.";

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
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      // Return the same response as "not found" to prevent format-based enumeration.
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
