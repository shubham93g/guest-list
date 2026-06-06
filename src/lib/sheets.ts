import { google } from 'googleapis';
import { unstable_cache } from 'next/cache';
import { SHEET_ID, SHEETS, GUEST_COLS } from './constants';
import type { Guest, ISOTimestamp, RSVPData } from '@/types';

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

// Strips the leading + so phone numbers stored without it in Sheets (e.g. 6591234567)
// match E.164 values from the API (e.g. +6591234567).
function normalisePhone(phone: string): string {
  return phone.replace(/^\+/, '').trim();
}

const PHONE_MAP_TAG = 'phone-map';

// Fetches columns B:C (country_code + phone) and builds a normalised phone → 1-indexed sheet row map.
// Stored in Next.js Data Cache (shared across all route bundles and Lambda instances).
// Expires after 10 minutes; RSVP writes do not invalidate it (columns B and C are never modified).
const getPhoneMap = unstable_cache(
  async (): Promise<Record<string, number>> => {
    console.log('[sheets] phone-map cache miss — fetching from Sheets API');
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEETS.GUESTS}!B2:C`,
    });
    const phoneToRow: Record<string, number> = {};
    ((res.data.values as string[][]) ?? []).forEach((r, i) => {
      const combined = normalisePhone((r[0] ?? '') + (r[1] ?? ''));
      if (combined) {
        phoneToRow[combined] = i + 2; // +1 for 1-indexing, +1 for header row
      }
    });
    console.log(`[sheets] phone-map cache populated with ${Object.keys(phoneToRow).length} entry(s)`);
    return phoneToRow;
  },
  [PHONE_MAP_TAG],
  { revalidate: 600, tags: [PHONE_MAP_TAG] }
);

export async function warmPhoneCache(): Promise<void> {
  await getPhoneMap();
}

export async function isPhoneAllowed(phone: string): Promise<boolean> {
  const phoneToRow = await getPhoneMap();
  return normalisePhone(phone) in phoneToRow;
}

export async function findGuestByPhone(phone: string): Promise<Guest | null> {
  const normPhone = normalisePhone(phone);
  const phoneToRow = await getPhoneMap();
  const sheetRow = phoneToRow[normPhone];
  if (sheetRow === undefined) {
    return null;
  }
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEETS.GUESTS}!A${sheetRow}:L${sheetRow}`,
  });
  const rowData = res.data.values?.[0] as string[] | undefined;
  if (!rowData) {
    return null;
  }
  const rowPhone = normalisePhone(
    (rowData[GUEST_COLS.COUNTRY_CODE] ?? '') + (rowData[GUEST_COLS.PHONE] ?? '')
  );
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
    countryCode: row[GUEST_COLS.COUNTRY_CODE] ?? '',
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
  const sheetRow = phoneToRow[normalisePhone(phone)];
  if (sheetRow === undefined) {
    throw new Error('Guest not found');
  }

  const sheets = await getSheetsClient();

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEETS.GUESTS}!D${sheetRow}:L${sheetRow}`,
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
