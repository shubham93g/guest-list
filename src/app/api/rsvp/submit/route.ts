import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { updateGuestRSVP } from '@/lib/sheets';

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
      return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    await updateGuestRSVP(session.phone, parsed.data);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[rsvp/submit]', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
