import { NextResponse } from 'next/server';
import { wedding } from '@/config/wedding';

function toIcsDatetime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export async function GET() {
  if (!wedding.datetimeISO) {
    return NextResponse.json({ error: 'Calendar not configured' }, { status: 503 });
  }

  const start = new Date(wedding.datetimeISO);
  if (isNaN(start.getTime())) {
    return NextResponse.json({ error: 'Invalid datetimeISO in wedding config' }, { status: 503 });
  }

  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);

  const locationParts = [wedding.venueAddress, wedding.venueCity, wedding.venueName].filter(Boolean);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//wedding-invite//calendar//EN',
    'BEGIN:VEVENT',
    `DTSTART:${toIcsDatetime(start)}`,
    `DTEND:${toIcsDatetime(end)}`,
    `SUMMARY:${wedding.coupleNames} Wedding`,
    ...(locationParts.length > 0 ? [`LOCATION:${locationParts.join(', ')}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const ics = lines.join('\r\n') + '\r\n';

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="wedding.ics"',
      'Cache-Control': 'no-store',
    },
  });
}
