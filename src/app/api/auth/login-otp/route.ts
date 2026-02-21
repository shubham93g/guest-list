import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyOTP, signJWT, OTP_CHANNEL } from '@/lib/auth';
import { findGuestByPhone, findGuestByEmail } from '@/lib/sheets';
import { setSessionCookie } from '@/lib/session';
import { checkRateLimit } from '@/lib/rate-limit';

const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

const schema = z.object({
  phone: z.string().optional(),
  email: z.string().optional(),
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

    const { code } = parsed.data;

    if (OTP_CHANNEL === 'email') {
      const rawEmail = parsed.data.email ?? '';
      if (!z.string().email().safeParse(rawEmail).success) {
        return NextResponse.json(
          { error: 'Please enter a valid email address.' },
          { status: 400 }
        );
      }
      // Normalise at the boundary — all downstream code receives lowercase email.
      const email = rawEmail.toLowerCase();

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
        // Should not normally happen (email passed OTP verification), but guard defensively.
        // Generic error avoids leaking whether the email is on the guest list (M1).
        return NextResponse.json(
          { error: 'Something went wrong. Please try again.' },
          { status: 500 }
        );
      }

      const token = await signJWT({ name: guest.name, phone: guest.phone, email: guest.email });
      return setSessionCookie(new NextResponse(null, { status: 200 }), token);
    }

    // sms / whatsapp
    const phone = parsed.data.phone ?? '';
    if (!PHONE_REGEX.test(phone)) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number.' },
        { status: 400 }
      );
    }

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
      // Should not normally happen (phone passed OTP verification), but guard defensively.
      // Generic error avoids leaking whether the phone is on the guest list (M1).
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      );
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
