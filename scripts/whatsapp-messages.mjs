// Sends WhatsApp template messages to guests, one campaign at a time. Each
// campaign (see scripts/whatsapp-campaigns.mjs) is tracked in its own tab.
//
// Usage: npm run whatsapp-messages -- <prepare|send|retry> <campaign> [--dry-run]
//
//   prepare    Rebuild the campaign tab from Guests (creating it if needed):
//              one row per guest, `template` from their rsvp_status, and
//              `exclude` set to `no phone` / `no template` where the guest
//              can't be sent to. Overwrites everything in the tab, including
//              manual edits — so it refuses once the tab has send results.
//   send       Send to every row with a blank exclude and status != sent.
//              Re-running only picks up failures and rows not yet attempted.
//   retry      Like send, but only rows whose status is `failed`.
//   --dry-run  Show what would happen without sending or writing anything.
//
// Manual control lives in the sheet: `exclude` is the single source of truth
// for who's skipped (any value skips; `yes` by convention), edit `template`
// to send a guest a different template, and edit `greeting_name`
// to change the {{1}} name — make these edits after your last prepare. Every command
// first checks the tab's header row matches MESSAGE_COLS and stops if a
// column was added, removed or moved by hand. `status: sent` means Meta
// accepted the message, not that it was delivered (that needs a webhook).
//
// Requires the GOOGLE_* and WHATSAPP_* secrets in .env.local (see .env.example).

import { google } from 'googleapis';
import { createInterface } from 'node:readline/promises';
import { GUEST_COLS, MESSAGE_COLS, RSVP_STATUS, SHEETS, SHEET_ID } from '../src/lib/constants.ts';
import { CAMPAIGNS } from './whatsapp-campaigns.mjs';

const GRAPH_API = 'https://graph.facebook.com/v21.0';
// Current Meta messaging tier: unique recipients per rolling 24 hours.
const DAILY_LIMIT = 250;
// Send results are written back in batches to stay under the Sheets
// per-minute write quota.
const FLUSH_EVERY = 20;

const COL_COUNT = Object.keys(MESSAGE_COLS).length;
const HEADER = Object.entries(MESSAGE_COLS)
  .sort(([, a], [, b]) => a - b)
  .map(([key]) => key.toLowerCase());

const colLetter = (index) => String.fromCharCode(65 + index);
const LAST_COL = colLetter(COL_COUNT - 1);
const range = (tab, a1) => `'${tab}'!${a1}`;
const digits = (value) => (value ?? '').replace(/\D/g, '');
const padRow = (row) => Array.from({ length: COL_COUNT }, (_, i) => row[i] ?? '');
const rowPhone = (row) => digits(row[MESSAGE_COLS.COUNTRY_CODE]) + digits(row[MESSAGE_COLS.PHONE]);
// Any non-empty exclude skips the row — `yes` is the manual value; prepare
// fills these two automatically.
const EXCLUDE_NO_PHONE = 'no phone';
const EXCLUDE_NO_TEMPLATE = 'no template';
const EXCLUDE_UNKNOWN_STATUS = 'unknown rsvp status';
// Statuses that expectedly get no message; any other unmapped status (e.g.
// attending_4th, or a typo in the sheet) is flagged as unknown instead.
const NO_MESSAGE_STATUSES = new Set([RSVP_STATUS.DECLINED, RSVP_STATUS.PENDING]);
const isExcluded = (row) => row[MESSAGE_COLS.EXCLUDE].trim() !== '';
const greetingName = (row) => row[MESSAGE_COLS.GREETING_NAME] || row[MESSAGE_COLS.NAME];

const sheets = google.sheets({
  version: 'v4',
  auth: new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  }),
});

async function readRange(a1Range) {
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: a1Range });
  return res.data.values ?? [];
}

async function tabExists(tab) {
  const res = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: 'sheets.properties.title',
  });
  return res.data.sheets.some((s) => s.properties.title === tab);
}

async function createTab(tab) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [{
        addSheet: { properties: { title: tab, gridProperties: { frozenRowCount: 1 } } },
      }],
    },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: range(tab, `A1:${LAST_COL}1`),
    valueInputOption: 'RAW',
    requestBody: { values: [HEADER] },
  });
  console.log(`Created the ${tab} tab`);
}

// Guards against hand edits that insert, remove, rename or reorder columns —
// without this, prepare/send would silently write into the wrong columns.
async function assertHeader(tab) {
  const [actual = []] = await readRange(range(tab, '1:1'));
  const mismatches = HEADER
    .map((expected, i) => ({ col: colLetter(i), expected, actual: (actual[i] ?? '').trim() }))
    .filter(({ expected, actual: found }) => expected !== found);
  const extra = actual.slice(COL_COUNT).filter((cell) => cell.trim());
  if (mismatches.length === 0 && extra.length === 0) {
    return;
  }
  console.error(`The ${tab} header row doesn't match the expected columns:`);
  for (const { col, expected, actual: found } of mismatches) {
    console.error(`  col ${col}: expected "${expected}", found "${found}"`);
  }
  if (extra.length > 0) {
    console.error(`  unexpected extra column(s) after ${LAST_COL}: ${extra.join(', ')}`);
  }
  console.error(`Expected: ${HEADER.join(' | ')}`);
  process.exit(1);
}

async function prepare(campaign, { dryRun }) {
  const exists = await tabExists(campaign.tab);
  if (exists) {
    await assertHeader(campaign.tab);
    // prepare wipes the tab, including send results — after any send that
    // would let the next `send` message everyone again, so refuse instead.
    const existing = (await readRange(range(campaign.tab, `A2:${LAST_COL}`))).map(padRow);
    const attempted = existing.filter((row) => row[MESSAGE_COLS.STATUS].trim()).length;
    if (attempted > 0) {
      console.error(`${campaign.tab} already has send results for ${attempted} row(s) — prepare would erase them and allow re-sending.`);
      console.error('Use send / retry to continue this campaign, or delete the tab to start over.');
      process.exit(1);
    }
  }

  const guests = await readRange(`${SHEETS.GUESTS}!A2:L`);
  const rows = [];
  for (const guest of guests) {
    const name = (guest[GUEST_COLS.NAME] ?? '').trim();
    const countryCode = guest[GUEST_COLS.COUNTRY_CODE] ?? '';
    const phone = guest[GUEST_COLS.PHONE] ?? '';
    if (!name && !digits(countryCode + phone)) {
      continue;
    }
    const rsvpStatus = guest[GUEST_COLS.RSVP_STATUS] || RSVP_STATUS.PENDING;
    const row = padRow([]);
    row[MESSAGE_COLS.NAME] = name;
    row[MESSAGE_COLS.COUNTRY_CODE] = countryCode;
    row[MESSAGE_COLS.PHONE] = phone;
    row[MESSAGE_COLS.RSVP_STATUS] = rsvpStatus;
    row[MESSAGE_COLS.TEMPLATE] = campaign.templates[rsvpStatus] ?? '';
    row[MESSAGE_COLS.GREETING_NAME] = name;
    if (!rowPhone(row)) {
      row[MESSAGE_COLS.EXCLUDE] = EXCLUDE_NO_PHONE;
    } else if (!row[MESSAGE_COLS.TEMPLATE]) {
      row[MESSAGE_COLS.EXCLUDE] = NO_MESSAGE_STATUSES.has(rsvpStatus) ? EXCLUDE_NO_TEMPLATE : EXCLUDE_UNKNOWN_STATUS;
    }
    rows.push(row);
  }

  const toSend = {};
  const excluded = {};
  for (const row of rows) {
    const bucket = isExcluded(row) ? excluded : toSend;
    const label = row[MESSAGE_COLS.EXCLUDE] || row[MESSAGE_COLS.TEMPLATE];
    bucket[label] = (bucket[label] ?? 0) + 1;
  }
  const phones = rows.map(rowPhone).filter(Boolean);
  const duplicates = [...new Set(phones.filter((phone, i) => phones.indexOf(phone) !== i))];

  console.log(`${rows.length} guest(s)`);
  console.log('To send:');
  for (const [label, count] of Object.entries(toSend)) {
    console.log(`  ${label}: ${count}`);
  }
  console.log('Excluded:');
  for (const [label, count] of Object.entries(excluded)) {
    console.log(`  ${label}: ${count}`);
  }
  const noPhone = rows.filter((row) => !rowPhone(row)).map((row) => row[MESSAGE_COLS.NAME]);
  if (noPhone.length > 0) {
    console.warn(`No phone in ${SHEETS.GUESTS}: ${noPhone.join(', ')}`);
  }
  if (duplicates.length > 0) {
    console.warn(`Phone(s) on more than one guest — they'd be messaged once per row: ${duplicates.join(', ')}`);
  }

  if (dryRun) {
    console.log(`\nDry run — nothing written${exists ? ` (would overwrite ${campaign.tab})` : ''}`);
    return;
  }
  if (exists) {
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range: range(campaign.tab, `A2:${LAST_COL}`),
    });
  } else {
    await createTab(campaign.tab);
  }
  if (rows.length === 0) {
    return;
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: range(campaign.tab, `A2:${LAST_COL}${rows.length + 1}`),
    valueInputOption: 'RAW',
    requestBody: { values: rows },
  });
  console.log(`\nWrote ${rows.length} row(s) to ${campaign.tab}`);
}

async function sendTemplate(to, template, language, name) {
  try {
    const res = await fetch(`${GRAPH_API}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: template,
          language: { code: language },
          components: [{ type: 'body', parameters: [{ type: 'text', text: name }] }],
        },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = data.error ?? {};
      return { error: `${error.code ?? res.status}: ${error.error_data?.details ?? error.message ?? 'unknown error'}` };
    }
    return { messageId: data.messages?.[0]?.id ?? '' };
  } catch (err) {
    return { error: `network: ${err.message}` };
  }
}

async function confirm(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim().toLowerCase() === 'y';
}

async function send(campaign, { dryRun, failedOnly }) {
  if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    console.error('Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env.local');
    process.exit(1);
  }
  if (!(await tabExists(campaign.tab))) {
    console.error(`No ${campaign.tab} tab yet — run prepare first`);
    process.exit(1);
  }
  await assertHeader(campaign.tab);

  const rows = (await readRange(range(campaign.tab, `A2:${LAST_COL}`))).map(padRow);
  const targets = rows
    .map((row, i) => ({ row, sheetRow: i + 2 }))
    .filter(({ row }) => {
      if (!row[MESSAGE_COLS.TEMPLATE].trim() || isExcluded(row) || !rowPhone(row)) {
        return false;
      }
      const status = row[MESSAGE_COLS.STATUS];
      return failedOnly ? status === 'failed' : status !== 'sent';
    });

  if (targets.length === 0) {
    console.log(failedOnly ? 'No failed rows to retry' : 'Nothing to send');
    return;
  }

  for (const { row } of targets) {
    const previous = row[MESSAGE_COLS.STATUS] ? ` (was ${row[MESSAGE_COLS.STATUS]})` : '';
    console.log(`  ${rowPhone(row)}  ${row[MESSAGE_COLS.TEMPLATE]}  "${greetingName(row)}"${previous}`);
  }
  console.log(`\n${targets.length} message(s) to send`);
  if (targets.length > DAILY_LIMIT) {
    console.warn(`Warning: more than the ${DAILY_LIMIT}/24h messaging limit — the rest will fail and can be retried later`);
  }

  if (dryRun) {
    console.log('Dry run — nothing sent');
    return;
  }
  if (!(await confirm('Send now? (y/N) '))) {
    console.log('Cancelled');
    return;
  }

  const statusRange = (sheetRow) =>
    range(campaign.tab, `${colLetter(MESSAGE_COLS.STATUS)}${sheetRow}:${colLetter(MESSAGE_COLS.ATTEMPTED_AT)}${sheetRow}`);
  let pending = [];
  const flush = async () => {
    if (pending.length === 0) {
      return;
    }
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { valueInputOption: 'RAW', data: pending },
    });
    pending = [];
  };

  let sent = 0;
  let failed = 0;
  try {
    for (const { row, sheetRow } of targets) {
      const to = rowPhone(row);
      const { messageId, error } = await sendTemplate(to, row[MESSAGE_COLS.TEMPLATE].trim(), campaign.language, greetingName(row));
      if (error) {
        failed++;
        console.log(`  ✗ ${to}  ${error}`);
      } else {
        sent++;
        console.log(`  ✓ ${to}`);
      }
      pending.push({
        range: statusRange(sheetRow),
        values: [[error ? 'failed' : 'sent', messageId ?? '', error ?? '', new Date().toISOString()]],
      });
      if (pending.length >= FLUSH_EVERY) {
        await flush();
      }
    }
  } finally {
    await flush();
  }

  console.log(`\n${sent} sent, ${failed} failed${failed > 0 ? ' — run `retry` to resend the failures' : ''}`);
}

const USAGE = 'Usage: npm run whatsapp-messages -- <prepare|send|retry> <campaign> [--dry-run]';
const [command, campaignName, ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');

const campaign = CAMPAIGNS[campaignName];
if (!campaign) {
  console.error(USAGE);
  console.error(`Campaigns: ${Object.keys(CAMPAIGNS).join(', ')}`);
  process.exit(1);
}
// Manual scripts must never write to the app's tabs (Guests is read-only
// here) — every write in this file targets campaign.tab, so refuse to run if
// a campaign is misconfigured to point at one of them.
const appTabs = Object.values(SHEETS).map((tab) => tab.toLowerCase());
if (appTabs.includes(campaign.tab.trim().toLowerCase())) {
  console.error(`Campaign tab "${campaign.tab}" is an app tab — pick a dedicated tab name`);
  process.exit(1);
}

switch (command) {
  case 'prepare':
    await prepare(campaign, { dryRun });
    break;
  case 'send':
    await send(campaign, { dryRun, failedOnly: false });
    break;
  case 'retry':
    await send(campaign, { dryRun, failedOnly: true });
    break;
  default:
    console.error(USAGE);
    process.exit(1);
}
