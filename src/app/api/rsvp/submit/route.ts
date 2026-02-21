import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { updateGuestRSVP } from '@/lib/sheets';
import { checkRateLimit } from '@/lib/rate-limit';

const schema = z.object({
  status: z.enum(['attending', 'declined']),
  dietaryNotes: z.string().max(500).default(''),
  plusOneAttending: z.boolean().default(false),
  plusOneName: z.string().max(100).default(''),
  notes: z.string().max(500).default(''),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Rate-limit by authenticated identifier: 10 per 15 min to prevent Sheets quota abuse (M3).
    const identifier = session.phone || session.email || 'unknown';
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

    // M6: Clear plusOneName server-side when plusOneAttending is false so stale
    // names are never written to Sheets regardless of what the client sends.
    if (!data.plusOneAttending) {
      data.plusOneName = '';
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
