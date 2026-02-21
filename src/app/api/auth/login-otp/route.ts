import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyOTP, signJWT, AUTH_CHANNEL } from '@/lib/auth';
import { findGuestByPhone, findGuestByEmail } from '@/lib/sheets';
import { setSessionCookie } from '@/lib/session';
import { checkRateLimit } from '@/lib/rate-limit';

// Each schema validates only the identifier field needed for the active channel.
// Extra fields in the body are ignored by zod (stripped by default).
// Keep format validation consistent with send-otp (M2).
const emailSchema = z.object({
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address.'),
  code: z.string().length(6, 'Code must be 6 digits'),
});
const phoneSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Please enter a valid phone number.'),
  code: z.string().length(6, 'Code must be 6 digits'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (AUTH_CHANNEL === 'email') {
      const parsed = emailSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.errors[0].message },
          { status: 400 }
        );
      }
      // Normalise at the route boundary — same key as send-otp uses.
      const email = parsed.data.email.trim().toLowerCase();
      const { code } = parsed.data;

      // Rate-limit by email: 5 attempts per 10 min to prevent OTP brute-force (H1).
      const limit = checkRateLimit(`login-otp:email:${email}`, 5, 10 * 60);
      if (limit.limited) {
        return NextResponse.json(
          { error: 'Too many attempts. Please request a new code and try again.' },
          { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
        );
      }

      const approved = await verifyOTP(email, code);
      if (!approved) {
        return NextResponse.json(
          { error: 'Incorrect code. Please try again.' },
          { status: 400 }
        );
      }

      const guest = await findGuestByEmail(email);
      if (!guest) {
        // Generic 500 — do not reveal whether the email exists (anti-enumeration M1).
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
      }

      const token = await signJWT({ name: guest.name, phone: guest.phone, email: guest.email });
      return setSessionCookie(new NextResponse(null, { status: 200 }), token);
    }

    // sms / whatsapp
    const parsed = phoneSchema.safeParse(body);
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
      // Generic 500 — do not reveal whether the phone exists (anti-enumeration M1).
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }

    const token = await signJWT({ name: guest.name, phone: guest.phone, email: guest.email });
    return setSessionCookie(new NextResponse(null, { status: 200 }), token);
  } catch (err) {
    console.error('[login-otp]', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
