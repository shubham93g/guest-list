import { google } from 'googleapis';
import { SHEET_ID, SHEETS, GUEST_COLS } from './constants';
import type { Guest, ISOTimestamp, RSVPData } from '@/types';

const CACHE_TTL_MS = 5 * 60 * 1_000; // 5 minutes

// phone (normalised, no +) → 1-indexed sheet row number (accounting for header row)
let phoneMapCache: { phoneToRow: Map<string, number>; cachedAt: number } | null = null;

// Module-level singleton — persists across warm Vercel invocations so the
// internal OAuth token cache is reused rather than re-fetched each call.
const authClient = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function getSheetsClient() {
  return google.sheets({ version: 'v4', auth: authClient });
}

// Fetches column B only and builds a map of normalised phone → sheet row number.
// Cached for CACHE_TTL_MS; invalidated on RSVP write.
async function getPhoneMap(): Promise<Map<string, number>> {
  if (phoneMapCache && Date.now() - phoneMapCache.cachedAt < CACHE_TTL_MS) {
    return phoneMapCache.phoneToRow;
  }
  console.log('[sheets] phone-map cache miss — fetching from Sheets API');
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEETS.GUESTS}!B2:B`,
  });
  const phoneToRow = new Map<string, number>();
  ((res.data.values as string[][]) ?? []).forEach((r, i) => {
    const phone = normalisePhone(r[0] ?? '');
    if (phone) {
      phoneToRow.set(phone, i + 2); // +1 for 1-indexing, +1 for header row
    }
  });
  phoneMapCache = { phoneToRow, cachedAt: Date.now() };
  console.log(`[sheets] phone-map cache populated with ${phoneToRow.size} entry(s)`);
  return phoneToRow;
}

// Strips the leading + so phone numbers stored without it in Sheets (e.g. 6591234567)
// match E.164 values from the API (e.g. +6591234567).
function normalisePhone(phone: string): string {
  return phone.replace(/^\+/, '').trim();
}

export async function isPhoneAllowed(phone: string): Promise<boolean> {
  const phoneToRow = await getPhoneMap();
  return phoneToRow.has(normalisePhone(phone));
}

export async function findGuestByPhone(phone: string): Promise<Guest | null> {
  const normPhone = normalisePhone(phone);
  const phoneToRow = await getPhoneMap();
  const sheetRow = phoneToRow.get(normPhone);
  if (sheetRow === undefined) {
    return null;
  }
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEETS.GUESTS}!A${sheetRow}:K${sheetRow}`,
  });
  const rowData = res.data.values?.[0] as string[] | undefined;
  if (!rowData) {
    return null;
  }
  const rowPhone = normalisePhone(rowData[GUEST_COLS.PHONE] ?? '');
  if (rowPhone !== normPhone) {
    throw new Error(`[sheets] phone mismatch at row ${sheetRow}: cache said ${normPhone}, sheet has ${rowPhone}`);
  }
  return rowToGuest(rowData);
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
  const phoneToRow = await getPhoneMap();
  const sheetRow = phoneToRow.get(normalisePhone(phone));
  if (sheetRow === undefined) {
    throw new Error('Guest not found');
  }

  const sheets = await getSheetsClient();

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEETS.GUESTS}!C${sheetRow}:K${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        data.email,
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
  });
}
