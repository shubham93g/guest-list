import { google } from 'googleapis';
import { SHEET_ID, SHEETS, GUEST_COLS } from './constants';
import type { Guest, RSVPData } from '@/types';

const MOCK_SHEETS = process.env.MOCK_SHEETS === 'true';

// When MOCK_SHEETS=true, any phone number gets this guest profile.
// Configure via MOCK_SHEETS_GUEST_NAME in .env.local — never hardcode personal details here.
const MOCK_SHEETS_GUEST: Guest = {
  name: process.env.MOCK_SHEETS_GUEST_NAME ?? 'Guest Name',
  phone: '',
  rsvpStatus: 'pending',
  rsvpSubmittedAt: null,
  dietaryNotes: '',
  plusOneAttending: false,
  plusOneName: '',
  notes: '',
};

function getAuthClient() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function getSheetsClient() {
  const auth = getAuthClient();
  return google.sheets({ version: 'v4', auth });
}

async function getAllGuestRows(): Promise<string[][]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEETS.GUESTS}!A2:H`,
  });
  return (res.data.values as string[][]) ?? [];
}

// Strips the leading + so phone numbers stored without it in Sheets (e.g. 6591234567)
// match E.164 values from the API (e.g. +6591234567).
function normalisePhone(phone: string): string {
  return phone.replace(/^\+/, '').trim();
}

export async function findGuestByPhone(phone: string): Promise<Guest | null> {
  if (MOCK_SHEETS) {
    return { ...MOCK_SHEETS_GUEST, phone };
  }
  const rows = await getAllGuestRows();
  const row = rows.find((r) => normalisePhone(r[GUEST_COLS.PHONE] ?? '') === normalisePhone(phone));
  if (!row) {
    return null;
  }
  return rowToGuest(row);
}

const VALID_RSVP_STATUSES = new Set<string>(['attending', 'declined', 'pending']);

function toRSVPStatus(value: string | undefined): Guest['rsvpStatus'] {
  return VALID_RSVP_STATUSES.has(value ?? '') ? (value as Guest['rsvpStatus']) : 'pending';
}

function rowToGuest(row: string[]): Guest {
  return {
    name: row[GUEST_COLS.NAME] ?? '',
    phone: row[GUEST_COLS.PHONE] ?? '',
    rsvpStatus: toRSVPStatus(row[GUEST_COLS.RSVP_STATUS]),
    rsvpSubmittedAt: row[GUEST_COLS.RSVP_SUBMITTED_AT] ?? null,
    dietaryNotes: row[GUEST_COLS.DIETARY_NOTES] ?? '',
    plusOneAttending: row[GUEST_COLS.PLUS_ONE_ATTENDING] === 'yes',
    plusOneName: row[GUEST_COLS.PLUS_ONE_NAME] ?? '',
    notes: row[GUEST_COLS.NOTES] ?? '',
  };
}


export async function updateGuestRSVP(phone: string, data: RSVPData): Promise<void> {
  if (MOCK_SHEETS) {
    console.log('[mock] RSVP submitted', { phone, ...data });
    return;
  }
  const rows = await getAllGuestRows();
  const rowIndex = rows.findIndex((r) => normalisePhone(r[GUEST_COLS.PHONE] ?? '') === normalisePhone(phone));
  if (rowIndex === -1) {
    throw new Error(`Guest with phone ${phone} not found`);
  }

  const sheetRow = rowIndex + 2; // +1 for 1-indexing, +1 for header row
  const sheets = await getSheetsClient();

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: `${SHEETS.GUESTS}!C${sheetRow}:H${sheetRow}`,
          values: [[
            data.status,
            new Date().toISOString(),
            data.dietaryNotes,
            data.plusOneAttending ? 'yes' : 'no',
            data.plusOneName,
            data.notes,
          ]],
        },
      ],
    },
  });
}
