export const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

export const SHEETS = {
  GUESTS: 'Guests',
} as const;

// 0-indexed column positions in the Guests sheet
// Starting columns (admin fills before launch): name (A), phone (B)
// RSVP columns (written by API): C-H
export const GUEST_COLS = {
  NAME: 0,
  PHONE: 1,
  RSVP_STATUS: 2,
  RSVP_SUBMITTED_AT: 3,
  DIETARY_NOTES: 4,
  PLUS_ONE_ATTENDING: 5,
  PLUS_ONE_NAME: 6,
  NOTES: 7,
} as const;

export const SESSION_COOKIE = 'session';
export const SESSION_EXPIRY_DAYS = 30;
