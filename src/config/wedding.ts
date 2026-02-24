// Wedding configuration — edit this file to customise your wedding details.
// All values here appear on the public landing page and the /invite page.
// After editing, restart the dev server (or redeploy) for changes to take effect.

export const wedding = {
  // ── Identity ──────────────────────────────────────────────────────────────
  // Displayed in the browser tab, hero heading, and invite page.
  coupleNames: 'Shubham & Khaing Zin',

  // ── Date & Time ───────────────────────────────────────────────────────────
  date: '5th December 2026',   // e.g. 'November 15, 2025'
  day: 'Saturday',             // e.g. 'Saturday'
  time: 'Lunch',               // e.g. '6:00 PM IST' — shown on the venue card

  // ── Venue ─────────────────────────────────────────────────────────────────
  venueName: 'Fullerton Hotel',
  venueCity: 'Singapore',
  venueAddress: '', // full street address — used to build the Google Maps link

  // ── Calendar ──────────────────────────────────────────────────────────────
  // ISO 8601 datetime — used to generate Google Calendar link and .ics file.
  // Leave as '' to hide the "Add to Calendar" button.
  datetimeISO: '', // e.g. '2025-11-15T18:00:00+05:30'
};
