import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { findGuestByPhone } from '@/lib/sheets';
import { sendOTP } from '@/lib/auth';
import { MOCK_MODE } from '@/lib/mock';

const schema = z.object({
  phone: z.string().min(8, 'Please enter a valid phone number'),
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

    const { phone } = parsed.data;

    if (MOCK_MODE) {
      return NextResponse.json({ sent: true });
    }

    const guest = await findGuestByPhone(phone);

    if (!guest) {
      return NextResponse.json(
        { error: "We couldn't find your number on our guest list. Please double-check or reach out to us directly." },
        { status: 404 }
      );
    }

    await sendOTP(phone);
    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('[send-otp]', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
