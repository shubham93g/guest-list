export const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

export const SHEETS = {
  GUESTS: 'Guests',
  FLIGHTS: 'Flights',
} as const;

// 0-indexed column positions in the Guests sheet
// Starting columns (admin fills before launch): name (A), country_code (B), phone (C), email (D)
// RSVP columns (written by API): D-L written as range
export const GUEST_COLS = {
  NAME: 0,
  COUNTRY_CODE: 1,           // col B — country code digits only, e.g. "91"
  PHONE: 2,                  // col C — subscriber number only, e.g. "9876543210"
  EMAIL: 3,                  // col D
  RSVP_STATUS: 4,
  GUEST_COUNT: 5,            // col F — total attendees including the main guest (1-5, see MAX_GUEST_COUNT)
  PLUS_ONE_NAMES: 6,         // col G — comma-separated names of additional guests
  RSVP_SUBMITTED_AT: 7,      // col H
  REQUIRES_PARKING: 8,       // col I
  REQUIRES_ACCOMMODATION: 9, // col J
  DIETARY_NOTES: 10,         // col K
  MESSAGE: 11,               // col L — general message (last)
} as const;

// 0-indexed column positions in the Flights sheet
// A-C (name, country_code, phone) are copied from Guests on every submit — not pre-seeded by the admin.
export const FLIGHT_COLS = {
  NAME: 0,
  COUNTRY_CODE: 1,
  PHONE: 2,
  ARRIVAL_FROM: 3,               // col D
  ARRIVAL_DATE: 4,                // col E — YYYY-MM-DD
  ARRIVAL_TIME: 5,                 // col F — HH:mm
  ARRIVAL_FLIGHT_NUMBER: 6,        // col G
  DEPARTURE_DATE: 7,               // col H
  DEPARTURE_TIME: 8,               // col I
  DEPARTURE_FLIGHT_NUMBER: 9,      // col J
  MESSAGE: 10,                     // col K
  SUBMITTED_AT: 11,                // col L
} as const;

// 0-indexed column positions shared by every WhatsApp campaign tab (one tab
// per campaign, see scripts/whatsapp-campaigns.mjs) — only used by
// scripts/whatsapp-messages.mjs, never by the app.
// `prepare` rebuilds every column from Guests (refusing once any row has a
// send result); E-G can then be edited by hand; H-K are written by `send`. The script refuses to run if a tab's header row
// doesn't match this map, so columns can't be shifted by hand edits.
export const MESSAGE_COLS = {
  NAME: 0,
  COUNTRY_CODE: 1,
  PHONE: 2,
  RSVP_STATUS: 3,
  TEMPLATE: 4,       // col E — derived from rsvp_status; edit by hand to send a different template
  GREETING_NAME: 5,  // col F — fills {{1}}; set to name by prepare, then editable
  EXCLUDE: 6,        // col G — any value skips this guest; `yes` manually, or `no phone` / `campaign not configured` set by prepare
  STATUS: 7,         // col H — `sent` / `failed`
  MESSAGE_ID: 8,     // col I — WhatsApp message id on success
  ERROR: 9,          // col J — Meta error on failure
  ATTEMPTED_AT: 10,  // col K — ISO 8601 timestamp of the last send attempt
} as const;

// Single source of truth for max party size — enforced in both the RSVP form UI and the submit API's zod schema.
export const MAX_GUEST_COUNT = 5;

export const SESSION_COOKIE = 'session';
export const SESSION_EXPIRY_DAYS = 30;

export const INVITE_MODE_PARAM = 'mode' as const;
export const RECEPTION_MODE = 'reception' as const;
export const FLIGHTS_MODE = 'flights' as const;

export const RSVP_STATUS = {
  ATTENDING_BOTH: 'attending_both',
  ATTENDING_5TH:  'attending_5th',
  ATTENDING_4TH:  'attending_4th',
  DECLINED:       'declined',
  PENDING:        'pending',
} as const;

export function inviteHref(mode?: string | null): string {
  return mode === RECEPTION_MODE
    ? `/invite?${INVITE_MODE_PARAM}=${RECEPTION_MODE}`
    : '/invite';
}

// Builds the /login path for a given mode. mode is a general "where should
// login send the guest" signal — 'reception' toggles the invite display,
// 'flights' redirects to /flights after auth (see postLoginHref). Callers
// pass this straight through from the URL (e.g. middleware reading
// searchParams), so it's validated against the known modes rather than
// reflected as-is — mirrors the allowlist check inviteHref already does.
export function loginHref(mode?: string | null): string {
  return mode === RECEPTION_MODE || mode === FLIGHTS_MODE
    ? `/login?${INVITE_MODE_PARAM}=${mode}`
    : '/login';
}

// Where to send a guest after a successful login, based on the mode param
// that was threaded through /login.
export function postLoginHref(mode?: string | null): string {
  return mode === FLIGHTS_MODE ? '/flights' : inviteHref(mode);
}
