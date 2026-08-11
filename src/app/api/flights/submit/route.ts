import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { findGuestByPhone, upsertFlightDetails } from '@/lib/sheets';
import { checkRateLimit } from '@/lib/rate-limit';

const schema = z.object({
  arrivalFrom: z.string().min(1).max(100),
  arrivalDate: z.string().min(1),
  arrivalTime: z.string().min(1),
  arrivalFlightNumber: z.string().min(1).max(20),
  departureDate: z.string().min(1),
  departureTime: z.string().min(1),
  departureFlightNumber: z.string().min(1).max(20),
  message: z.string().max(500).default(''),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const limit = checkRateLimit(`flights:${session.phone}`, 10, 15 * 60);
    if (limit.limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const guest = await findGuestByPhone(session.phone);
    if (!guest) {
      return NextResponse.json({ error: 'Guest not found.' }, { status: 404 });
    }

    await upsertFlightDetails(guest.name, guest.countryCode, guest.phone, parsed.data);
    return new NextResponse(null, { status: 200 });
  } catch (err) {
    console.error('[flights/submit]', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
