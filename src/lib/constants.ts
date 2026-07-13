export const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

export const SHEETS = {
  GUESTS: 'Guests',
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
  GUEST_COUNT: 5,            // col F — total attendees including the main guest (1-4)
  PLUS_ONE_NAMES: 6,         // col G — comma-separated names of additional guests
  RSVP_SUBMITTED_AT: 7,      // col H
  REQUIRES_PARKING: 8,       // col I
  REQUIRES_ACCOMMODATION: 9, // col J
  DIETARY_NOTES: 10,         // col K
  MESSAGE: 11,               // col L — general message (last)
} as const;

export const SESSION_COOKIE = 'session';
export const SESSION_EXPIRY_DAYS = 30;

export const INVITE_MODE_PARAM = 'mode' as const;
export const RECEPTION_MODE = 'reception' as const;

export const RSVP_STATUS = {
  ATTENDING_BOTH: 'attending_both',
  ATTENDING_5TH:  'attending_5th',
  DECLINED:       'declined',
  PENDING:        'pending',
} as const;

export function inviteHref(mode?: string | null): string {
  return mode === RECEPTION_MODE
    ? `/invite?${INVITE_MODE_PARAM}=${RECEPTION_MODE}`
    : '/invite';
}

export function loginHref(mode?: string | null): string {
  return mode === RECEPTION_MODE
    ? `/login?${INVITE_MODE_PARAM}=${RECEPTION_MODE}`
    : '/login';
}
