import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { updateGuestRSVP } from '@/lib/sheets';
import { checkRateLimit } from '@/lib/rate-limit';

const schema = z.object({
  email: z.string().email().max(200).or(z.literal('')).default(''),
  status: z.enum(['attending_both', 'attending_5th', 'declined']),
  guestCount: z.number().int().min(1).max(4).default(1),
  plusOneNames: z.string().max(300).default(''),
  requiresParking: z.boolean().default(false),
  requiresAccommodation: z.boolean().default(false),
  dietaryNotes: z.string().max(500).default(''),
  message: z.string().max(500).default(''),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Rate-limit by authenticated identifier: 10 per 15 min to prevent Sheets quota abuse (M3).
    const identifier = session.phone ?? 'unknown';
    const limit = checkRateLimit(`rsvp:${identifier}`, 10, 15 * 60);
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

    const data = parsed.data;

    if (data.guestCount <= 1) {
      data.plusOneNames = '';
    }

    if (data.status === 'declined') {
      data.guestCount = 1;
      data.plusOneNames = '';
      data.requiresParking = false;
      data.requiresAccommodation = false;
      data.dietaryNotes = '';
    }

    await updateGuestRSVP(session.phone, data);
    return new NextResponse(null, { status: 200 });
  } catch (err) {
    console.error('[rsvp/submit]', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
