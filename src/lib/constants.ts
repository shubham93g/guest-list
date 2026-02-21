export const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

export const SHEETS = {
  GUESTS: 'Guests',
} as const;

// 0-indexed column positions in the Guests sheet
// Starting columns (admin fills before launch): name (A), phone (B), email (C)
// RSVP columns (written by API): D-I
export const GUEST_COLS = {
  NAME: 0,
  PHONE: 1,
  EMAIL: 2,
  RSVP_STATUS: 3,
  RSVP_SUBMITTED_AT: 4,
  DIETARY_NOTES: 5,
  PLUS_ONE_ATTENDING: 6,
  PLUS_ONE_NAME: 7,
  NOTES: 8,
} as const;

export const SESSION_COOKIE = 'session';
export const SESSION_EXPIRY_DAYS = 30;
