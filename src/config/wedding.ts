// Wedding configuration — edit this file to customise your wedding details.
// All values here appear on the public landing page and the /invite page.
// After editing, restart the dev server (or redeploy) for changes to take effect.

export const wedding = {
  // ── Identity ──────────────────────────────────────────────────────────────
  // Displayed in the browser tab, hero heading, and invite page.
  coupleNames: '[Partner A] & [Partner B]',

  // ── Date & Time ───────────────────────────────────────────────────────────
  date: '[Month Day, Year]',   // e.g. 'November 15, 2025'
  day: '[Day of Week]',        // e.g. 'Saturday'
  time: '[H:MM AM/PM TZ]',     // e.g. '6:00 PM IST' — shown on the venue card

  // ── Venue ─────────────────────────────────────────────────────────────────
  venueName: '[Venue Name]',
  venueCity: '[City]',
  venueAddress: '[Full street address]', // used to build the Google Maps link

  // ── Calendar ──────────────────────────────────────────────────────────────
  // ISO 8601 datetime — used to generate Google Calendar link and .ics file.
  // Leave as '' to hide the "Add to Calendar" button.
  datetimeISO: '', // e.g. '2025-11-15T18:00:00+05:30'
};
