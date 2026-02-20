import { google } from 'googleapis';
import { SHEET_ID, SHEETS, GUEST_COLS } from './constants';
import { MOCK_MODE, MOCK_GUEST, MOCK_EVENT } from './mock';
import type { Guest, EventDetails, RSVPData } from '@/types';

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

export async function findGuestByPhone(phone: string): Promise<Guest | null> {
  if (MOCK_MODE) return { ...MOCK_GUEST, phone };
  const rows = await getAllGuestRows();
  const row = rows.find((r) => r[GUEST_COLS.PHONE]?.trim() === phone.trim());
  if (!row) return null;
  return rowToGuest(row);
}

function rowToGuest(row: string[]): Guest {
  return {
    name: row[GUEST_COLS.NAME] ?? '',
    phone: row[GUEST_COLS.PHONE] ?? '',
    rsvpStatus: (row[GUEST_COLS.RSVP_STATUS] as Guest['rsvpStatus']) || 'pending',
    rsvpSubmittedAt: row[GUEST_COLS.RSVP_SUBMITTED_AT] || null,
    dietaryNotes: row[GUEST_COLS.DIETARY_NOTES] ?? '',
    plusOneAttending: row[GUEST_COLS.PLUS_ONE_ATTENDING] === 'yes',
    plusOneName: row[GUEST_COLS.PLUS_ONE_NAME] ?? '',
    notes: row[GUEST_COLS.NOTES] ?? '',
  };
}

export async function getEventDetails(): Promise<EventDetails> {
  if (MOCK_MODE) return MOCK_EVENT;
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEETS.EVENT}!A:B`,
  });
  const rows: string[][] = (res.data.values as string[][]) ?? [];
  const map = Object.fromEntries(rows.map(([k, v]) => [k, v ?? '']));
  return {
    weddingDate: map['wedding_date'] ?? '',
    weddingDay: map['wedding_day'] ?? '',
    venueName: map['venue_name'] ?? '',
    venueCity: map['venue_city'] ?? '',
    coupleNames: map['couple_names'] ?? '',
  };
}

export async function updateGuestRSVP(phone: string, data: RSVPData): Promise<void> {
  if (MOCK_MODE) { console.log('[mock] RSVP submitted', { phone, ...data }); return; }
  const rows = await getAllGuestRows();
  const rowIndex = rows.findIndex((r) => r[GUEST_COLS.PHONE]?.trim() === phone.trim());
  if (rowIndex === -1) throw new Error(`Guest with phone ${phone} not found`);

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
