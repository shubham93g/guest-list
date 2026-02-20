import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyOTP, signJWT } from '@/lib/auth';
import { findGuestByPhone } from '@/lib/sheets';
import { SESSION_COOKIE, SESSION_EXPIRY_DAYS } from '@/lib/constants';
import { MOCK_TWILIO } from '@/lib/mock';

const schema = z.object({
  phone: z.string().min(8, 'Please enter a valid phone number'),
  code: z.string().length(6, 'Code must be 6 digits'),
});

function setSessionCookie(res: NextResponse, token: string): NextResponse {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
  });
  return res;
}

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

    if (!MOCK_TWILIO) {
      const approved = await verifyOTP(phone, code);

      if (!approved) {
        return NextResponse.json(
          { error: 'Incorrect code. Please try again.' },
          { status: 400 }
        );
      }
    }

    const guest = await findGuestByPhone(phone);
    if (!guest) {
      return NextResponse.json({ error: 'Guest not found.' }, { status: 404 });
    }

    const token = await signJWT({ phone, name: guest.name });
    return setSessionCookie(NextResponse.json({ success: true }), token);
  } catch (err) {
    console.error('[verify-otp]', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
