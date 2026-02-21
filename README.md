# guest-list

Wedding guest management website — save the date, SMS/WhatsApp OTP authentication, RSVP, and guest management via Google Sheets.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS**
- **Google Sheets** — primary data store
- **Twilio Verify** — SMS or WhatsApp OTP authentication
- **Nodemailer + Gmail** — email OTP authentication (configurable via `OTP_CHANNEL`)
- **JWT cookies** — session management (`jose`)

## Prerequisites

- [Node.js](https://nodejs.org) v18+ — install via [nvm](https://github.com/nvm-sh/nvm) (recommended):
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  source ~/.nvm/nvm.sh
  nvm install --lts
  ```

## Setup

**1. Install dependencies**
```bash
npm install
```

**2. Configure environment variables**
```bash
cp .env.example .env.local
```
Fill in `.env.local`. To run in mock mode (no external services needed), set:
```
MOCK_SHEETS=true
MOCK_OTP=true
```
See the [External Services](#external-services) section for real credentials.

**3. Start the development server**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## Mock Mode

Each external service can be mocked independently — useful for development, previewing the UI, or integration testing against one real service at a time.

| Flag | Effect |
|------|--------|
| `MOCK_SHEETS=true` | Bypasses Google Sheets — any phone/email is accepted, RSVP writes log to console |
| `MOCK_OTP=true` | Bypasses OTP sending — any 6-digit code is accepted (all channels) |
| `MOCK_SHEETS_GUEST_NAME=` | Guest name shown when `MOCK_SHEETS=true` |

Set both flags together for a fully credential-free local flow. To use real integrations, remove (or set to `false`) the relevant flag and fill in the credentials below.

## External Services

### Google Sheets

The app authenticates via a **service account** — a dedicated non-human Google identity your app logs in as. Unlike API keys, service accounts work with private Sheets, are scoped to specific APIs, and can be revoked without changing code. Access to the Sheet is granted by sharing it directly with the service account (no IAM roles needed).

**1. Enable the Sheets API**
- Open your project in [console.cloud.google.com](https://console.cloud.google.com)
- Left sidebar → **APIs & Services** → **Library**
- Search "Google Sheets API" → **Enable**

**2. Create a service account**
- Left sidebar → **APIs & Services** → **Credentials**
- **+ Create Credentials** → **Service account**
- Name it (e.g. `guest-list-app`) → **Continue** → skip the IAM role step → **Done**

**3. Generate a JSON key**
- Click the service account you just created → **Keys** tab
- **Add Key** → **Create new key** → **JSON** → **Create**
- A `.json` file downloads — keep this safe, treat it like a password

**4. Share the Sheet with the service account**
- Open the downloaded JSON and copy the `client_email` value (looks like `guest-list-app@your-project.iam.gserviceaccount.com`)
- Open your Google Sheet → **Share** → paste that email → **Editor** access → uncheck "Notify people" → **Share**

**5. Set environment variables**

From the downloaded JSON:
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=   # client_email field
GOOGLE_PRIVATE_KEY=             # private_key field — the full -----BEGIN...END----- block
GOOGLE_SHEET_ID=                # from the Sheet URL: /spreadsheets/d/<THIS PART>/edit
```

For `GOOGLE_PRIVATE_KEY`: in `.env.local` paste it as a single line with literal `\n` between lines (`sheets.ts` converts them back). On Vercel, paste the raw multi-line PEM as-is.

**Sheet structure** — one tab named `Guests`, header in row 1, data from row 2:

| Col | Header | Notes |
|-----|--------|-------|
| A | `name` | Admin fills before launch |
| B | `phone` | Digits only, no `+` prefix — e.g. `919876543210`. Sheets strips `+` even in Plain Text cells, so omit it. The API normalises before comparing. |
| C | `email` | Guest email address. |
| D | `rsvp_status` | Written by API: `attending` / `declined` |
| E | `rsvp_submitted_at` | ISO 8601 timestamp |
| F | `dietary_notes` | |
| G | `plus_one_attending` | `yes` / `no` |
| H | `plus_one_name` | |
| I | `notes` | Guest message |

Event details (couple names, date, venue) are configured via env vars, not stored in Sheets.

### OTP Channel

Set `OTP_CHANNEL` in `.env.local` to choose your delivery method:
- `sms` (default) — uses Twilio Verify
- `whatsapp` — uses Twilio Verify (requires a Meta-approved WhatsApp Business Account)
- `email` — uses Nodemailer + Gmail (see Gmail SMTP section below)

### Twilio Verify (OTP_CHANNEL=sms or OTP_CHANNEL=whatsapp)

1. Sign up at [twilio.com](https://twilio.com)
2. Copy **Account SID** and **Auth Token** → `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
3. Go to Verify → Services → **Create new service**
4. Copy the **Service SID** → `TWILIO_VERIFY_SERVICE_SID`
5. For `sms` — works immediately on a trial account; no additional setup
6. For `whatsapp` — requires enabling the WhatsApp channel on the Verify Service and a Meta-approved WhatsApp Business Account

### Gmail SMTP (OTP_CHANNEL=email)

1. Enable 2-Step Verification on your Google account (required for App Passwords)
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Create an App Password for "Mail" → copy the 16-character password
4. Set environment variables:
   ```
   GMAIL_USER=you@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password
   ```

### JWT Secret

Generate a secure secret and set it as `JWT_SECRET`:
```bash
openssl rand -hex 32
```

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # ESLint (runs eslint src/)
```

## Claude Code Skills

If you use [Claude Code](https://claude.ai/code), the following slash commands are available:

| Command | Description |
|---------|-------------|
| `/restart-server` | Kill port 3000 and start the Next.js dev server |
| `/stop-server` | Kill the process on port 3000 |
| `/tail-logs` | Print the last 50 lines of dev server logs |

The dev server logs to `/tmp/nextjs-dev.log`. For live streaming in a terminal:
```bash
tail -f /tmp/nextjs-dev.log
```
