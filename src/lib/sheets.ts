import { google } from 'googleapis';
import { unstable_cache } from 'next/cache';
import { SHEET_ID, SHEETS, GUEST_COLS, FLIGHT_COLS, RSVP_STATUS } from './constants';
import type { FlightData, FlightDetails, Guest, ISOTimestamp, RSVPData } from '@/types';

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

const VALID_RSVP_STATUSES = new Set<string>(Object.values(RSVP_STATUS));

function toRSVPStatus(value: string | undefined): Guest['status'] {
  return VALID_RSVP_STATUSES.has(value ?? '') ? (value as Guest['status']) : RSVP_STATUS.PENDING;
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

// Unlike getPhoneMap, the Flights sheet is not pre-seeded — rows only exist
// once a guest has submitted, and upsertFlightDetails appends new rows —
// so this is deliberately NOT cached (unlike getPhoneMap). Always reading
// live from Sheets keeps the "one row per phone" check as accurate as
// possible against concurrent submissions; expected traffic on /flights is
// low enough (~20-30 guests) that the extra API call per lookup is cheap.
async function fetchFlightPhoneMap(): Promise<Record<string, number>> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEETS.FLIGHTS}!B2:C`,
  });
  const phoneToRow: Record<string, number> = {};
  ((res.data.values as string[][]) ?? []).forEach((r, i) => {
    const combined = normalisePhone((r[0] ?? '') + (r[1] ?? ''));
    if (combined) {
      phoneToRow[combined] = i + 2; // +1 for 1-indexing, +1 for header row
    }
  });
  return phoneToRow;
}

function rowToFlight(row: string[]): FlightDetails {
  return {
    name: row[FLIGHT_COLS.NAME] ?? '',
    countryCode: row[FLIGHT_COLS.COUNTRY_CODE] ?? '',
    phone: row[FLIGHT_COLS.PHONE] ?? '',
    arrivalFrom: row[FLIGHT_COLS.ARRIVAL_FROM] ?? '',
    arrivalDate: row[FLIGHT_COLS.ARRIVAL_DATE] ?? '',
    arrivalTime: row[FLIGHT_COLS.ARRIVAL_TIME] ?? '',
    arrivalFlightNumber: row[FLIGHT_COLS.ARRIVAL_FLIGHT_NUMBER] ?? '',
    departureDate: row[FLIGHT_COLS.DEPARTURE_DATE] ?? '',
    departureTime: row[FLIGHT_COLS.DEPARTURE_TIME] ?? '',
    departureFlightNumber: row[FLIGHT_COLS.DEPARTURE_FLIGHT_NUMBER] ?? '',
    message: row[FLIGHT_COLS.MESSAGE] ?? '',
    submittedAt: (row[FLIGHT_COLS.SUBMITTED_AT] as ISOTimestamp) ?? null,
  };
}

export async function findFlightByPhone(phone: string): Promise<FlightDetails | null> {
  const normPhone = normalisePhone(phone);
  const phoneToRow = await fetchFlightPhoneMap();
  const sheetRow = phoneToRow[normPhone];
  if (sheetRow === undefined) {
    return null;
  }
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEETS.FLIGHTS}!A${sheetRow}:L${sheetRow}`,
  });
  const rowData = res.data.values?.[0] as string[] | undefined;
  if (!rowData) {
    return null;
  }
  const rowPhone = normalisePhone(
    (rowData[FLIGHT_COLS.COUNTRY_CODE] ?? '') + (rowData[FLIGHT_COLS.PHONE] ?? '')
  );
  if (rowPhone !== normPhone) {
    throw new Error(`[sheets] flight phone mismatch at row ${sheetRow}: lookup said ${normPhone}, sheet has ${rowPhone}`);
  }
  return rowToFlight(rowData);
}

export async function upsertFlightDetails(
  name: string,
  countryCode: string,
  phone: string,
  data: FlightData
): Promise<void> {
  // Lookup key mirrors how the phone map is built — normalised country_code + phone
  // (columns B + C combined), matching the Guests sheet's phone-map convention.
  const normPhone = normalisePhone(countryCode + phone);
  const phoneToRow = await fetchFlightPhoneMap();
  const sheetRow = phoneToRow[normPhone];
  const sheets = await getSheetsClient();

  const values = [[
    name,
    countryCode,
    phone,
    data.arrivalFrom,
    data.arrivalDate,
    data.arrivalTime,
    data.arrivalFlightNumber,
    data.departureDate,
    data.departureTime,
    data.departureFlightNumber,
    data.message,
    new Date().toISOString(),
  ]];

  if (sheetRow !== undefined) {
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEETS.FLIGHTS}!B${sheetRow}:C${sheetRow}`,
    });
    const existingRow = existing.data.values?.[0] as string[] | undefined;
    const existingPhone = normalisePhone((existingRow?.[0] ?? '') + (existingRow?.[1] ?? ''));
    if (existingPhone !== normPhone) {
      throw new Error(`[sheets] flight phone mismatch at row ${sheetRow}: lookup said ${normPhone}, sheet has ${existingPhone}`);
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEETS.FLIGHTS}!A${sheetRow}:L${sheetRow}`,
      valueInputOption: 'RAW',
      requestBody: { values },
    });
    return;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEETS.FLIGHTS}!A:L`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values },
  });
}
