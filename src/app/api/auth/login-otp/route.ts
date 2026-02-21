import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyOTP, signJWT } from '@/lib/auth';
import { findGuestByPhone } from '@/lib/sheets';
import { setSessionCookie } from '@/lib/session';
import { checkRateLimit } from '@/lib/rate-limit';

// Keep phone validation consistent with send-otp (M2).
const schema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Please enter a valid phone number.'),
  code: z.string().length(6, 'Code must be 6 digits'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { phone, code } = parsed.data;

    // Rate-limit by phone: 5 attempts per 10 min to prevent OTP brute-force (H1).
    const limit = checkRateLimit(`login-otp:phone:${phone}`, 5, 10 * 60);
    if (limit.limited) {
      return NextResponse.json(
        { error: 'Too many attempts. Please request a new code and try again.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const approved = await verifyOTP(phone, code);
    if (!approved) {
      return NextResponse.json(
        { error: 'Incorrect code. Please try again.' },
        { status: 400 }
      );
    }

    const guest = await findGuestByPhone(phone);
    if (!guest) {
      return NextResponse.json({ error: 'Guest not found.' }, { status: 404 });
    }

    const token = await signJWT({ phone, name: guest.name });
    return setSessionCookie(new NextResponse(null, { status: 200 }), token);
  } catch (err) {
    console.error('[login-otp]', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
