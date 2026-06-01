export const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

export const SHEETS = {
  GUESTS: 'Guests',
} as const;

// 0-indexed column positions in the Guests sheet
// Starting columns (admin fills before launch): name (A), phone (B), email (C)
// RSVP columns (written by API): C-H (email updated on submit), D-I written as range
export const GUEST_COLS = {
  NAME: 0,
  PHONE: 1,
  EMAIL: 2,
  RSVP_STATUS: 3,
  GUEST_COUNT: 4,            // col E — total attendees including the main guest (1-4)
  PLUS_ONE_NAMES: 5,         // col F — comma-separated names of additional guests
  RSVP_SUBMITTED_AT: 6,      // col G
  REQUIRES_PARKING: 7,       // col H
  REQUIRES_ACCOMMODATION: 8, // col I
  DIETARY_NOTES: 9,          // col J
  MESSAGE: 10,               // col K — general message (last)
} as const;

export const SESSION_COOKIE = 'session';
export const SESSION_EXPIRY_DAYS = 30;
