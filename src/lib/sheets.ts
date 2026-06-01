import { google } from 'googleapis';
import { SHEET_ID, SHEETS, GUEST_COLS } from './constants';
import type { Guest, ISOTimestamp, RSVPData } from '@/types';

const CACHE_TTL_MS = 5 * 60 * 1_000; // 5 minutes

interface GuestRowsCache {
  rows: string[][];
  cachedAt: number;
}

let guestRowsCache: GuestRowsCache | null = null;

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
  if (guestRowsCache && Date.now() - guestRowsCache.cachedAt < CACHE_TTL_MS) {
    return guestRowsCache.rows;
  }
  console.log('[sheets] cache miss — fetching from Sheets API');
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEETS.GUESTS}!A2:K`,
  });
  const rows = (res.data.values as string[][]) ?? [];
  guestRowsCache = { rows, cachedAt: Date.now() };
  console.log(`[sheets] cache populated with ${rows.length} row(s)`);
  return rows;
}

// Strips the leading + so phone numbers stored without it in Sheets (e.g. 6591234567)
// match E.164 values from the API (e.g. +6591234567).
function normalisePhone(phone: string): string {
  return phone.replace(/^\+/, '').trim();
}

export async function findGuestByPhone(phone: string): Promise<Guest | null> {
  const rows = await getAllGuestRows();
  const row = rows.find((r) => normalisePhone(r[GUEST_COLS.PHONE] ?? '') === normalisePhone(phone));
  if (!row) {
    return null;
  }
  return rowToGuest(row);
}


const VALID_RSVP_STATUSES = new Set<string>(['attending_both', 'attending_5th', 'declined', 'pending']);

function toRSVPStatus(value: string | undefined): Guest['status'] {
  return VALID_RSVP_STATUSES.has(value ?? '') ? (value as Guest['status']) : 'pending';
}

function rowToGuest(row: string[]): Guest {
  return {
    name: row[GUEST_COLS.NAME] ?? '',
    phone: row[GUEST_COLS.PHONE] ?? '',
    email: row[GUEST_COLS.EMAIL] ?? '',
    status: toRSVPStatus(row[GUEST_COLS.RSVP_STATUS]),
    rsvpSubmittedAt: (row[GUEST_COLS.RSVP_SUBMITTED_AT] as ISOTimestamp) ?? null,
    message: row[GUEST_COLS.MESSAGE] ?? '',
    guestCount: parseInt(row[GUEST_COLS.GUEST_COUNT] ?? '1', 10) || 1,
    plusOneNames: row[GUEST_COLS.PLUS_ONE_NAMES] ?? '',
    requiresParking: row[GUEST_COLS.REQUIRES_PARKING] === 'yes',
    requiresAccommodation: row[GUEST_COLS.REQUIRES_ACCOMMODATION] === 'yes',
    dietaryNotes: row[GUEST_COLS.DIETARY_NOTES] ?? '',
  };
}


export async function updateGuestRSVP(phone: string, data: RSVPData): Promise<void> {
  const rows = await getAllGuestRows();
  const rowIndex = rows.findIndex((r) => normalisePhone(r[GUEST_COLS.PHONE] ?? '') === normalisePhone(phone));
  if (rowIndex === -1) {
    throw new Error('Guest not found');
  }

  const sheetRow = rowIndex + 2; // +1 for 1-indexing, +1 for header row
  const sheets = await getSheetsClient();

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: `${SHEETS.GUESTS}!C${sheetRow}`,
          values: [[data.email]],
        },
        {
          range: `${SHEETS.GUESTS}!D${sheetRow}:K${sheetRow}`,
          values: [[
            data.status,
            String(data.guestCount),
            data.guestCount > 1 ? data.plusOneNames : '',
            new Date().toISOString() as ISOTimestamp,
            data.requiresParking ? 'yes' : 'no',
            data.requiresAccommodation ? 'yes' : 'no',
            data.dietaryNotes,
            data.message,
          ]],
        },
      ],
    },
  });
  guestRowsCache = null;
  console.log('[sheets] cache invalidated after RSVP write');
}
