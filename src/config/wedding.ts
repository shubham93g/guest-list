// Wedding configuration — edit this file to customise your wedding details.
// All values here appear on the public landing page and the /invite page.
// After editing, restart the dev server (or redeploy) for changes to take effect.

import type { WeddingEvent } from '@/types';

// ── Identity ───────────────────────────────────────────────────────────────
// Displayed in the browser tab, hero heading, and invite page.
// Shared across all events — not part of WeddingEvent.
export const brideCoupleName = 'Khaing Zin & Shubham';
export const groomCoupleName = 'Shubham & Khaing Zin';

// ── Events ─────────────────────────────────────────────────────────────────
// Each event is typed as WeddingEvent. Add more exports here for additional
// events (e.g. reception, sangeet) when needed.

export const indianEvent = {
  title: 'Indian Wedding',

  // Date & Time
  date: '4th December 2026',   // e.g. 'November 15, 2025'
  day: 'Friday',             // e.g. 'Saturday'
  time: '11:00 am',               // e.g. '6:00 PM IST'

  // Venue
  venueName: 'Plume Singapore',
  venueCity: 'Singapore',
  venueAddress: '30 Raffles Ave., #01-02, Singapore 039803',
  venueMapUrl: 'https://maps.app.goo.gl/aenYLR5aYSFj9ZmLA',

  // Calendar — ISO 8601 datetime used to generate Google Calendar link and .ics.
  // Leave datetimeISO as '' to hide the "Add to Calendar" button.
  datetimeISO: '2026-12-04T11:00:00+08:00',
  durationHours: 4,
} satisfies WeddingEvent;

export const receptionEvent = {
  title: 'Reception',

  // Date & Time
  date: '5th December 2026',   // e.g. 'November 15, 2025'
  day: 'Saturday',             // e.g. 'Saturday'
  time: '11:00 am',               // e.g. '6:00 PM IST'

  // Venue
  venueName: 'Fullerton Hotel',
  venueCity: 'Singapore',
  venueAddress: '1 Fullerton Sq, Singapore 049178',
  venueMapUrl: 'https://maps.app.goo.gl/QKoW6gL6dRsUUrHy9',

  // Calendar — ISO 8601 datetime used to generate Google Calendar link and .ics.
  // Leave datetimeISO as '' to hide the "Add to Calendar" button.
  datetimeISO: '2026-12-05T11:00:00+08:00',
  durationHours: 4,
} satisfies WeddingEvent;
