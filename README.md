# guest-list

Wedding guest management website — save the date, WhatsApp OTP authentication, RSVP, and guest management via Google Sheets.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS**
- **Google Sheets** — primary data store
- **Twilio Verify** — WhatsApp OTP authentication
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
MOCK_MODE=true
NEXT_PUBLIC_MOCK_MODE=true
```
See the [External Services](#external-services) section for real credentials.

**3. Start the development server**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## Mock Mode

Mock mode bypasses Google Sheets and Twilio entirely — useful for development and previewing the UI without any credentials.

When enabled, the verify flow accepts any phone number and uses `000000` as the OTP code. Configure the mock guest and event details via the `MOCK_GUEST_*` and `MOCK_EVENT_*` vars in `.env.local`.

To disable mock mode and use real integrations, set `MOCK_MODE=false` and `NEXT_PUBLIC_MOCK_MODE=false` in `.env.local` and fill in the credentials below.

## External Services

### Google Sheets

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a project
2. Enable the **Google Sheets API**
3. Create a **Service Account** (IAM & Admin → Service Accounts → Create)
4. Generate a JSON key for the service account (Actions → Manage Keys → Add Key → JSON)
5. From the downloaded JSON, copy `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `private_key` → `GOOGLE_PRIVATE_KEY`
6. Create a Google Sheet, share it with the service account email (Editor access), and copy the spreadsheet ID from the URL → `GOOGLE_SHEET_ID`

**Sheet structure** — one tab only:

`Guests` tab (header row 1, columns A–H):
| Col | Header |
|-----|--------|
| A | `name` |
| B | `phone` (E.164 format, e.g. `+919876543210`) |
| C | `rsvp_status` |
| D | `rsvp_submitted_at` |
| E | `dietary_notes` |
| F | `plus_one_attending` |
| G | `plus_one_name` |
| H | `notes` |

Event details (couple names, date, venue) are configured via env vars, not stored in Sheets.

### Twilio Verify (WhatsApp OTP)

1. Sign up at [twilio.com](https://twilio.com)
2. Copy **Account SID** and **Auth Token** → `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
3. Go to Verify → Services → Create a service → enable the **WhatsApp** channel
4. Copy the **Service SID** → `TWILIO_VERIFY_SERVICE_SID`

> **Note:** During development, Twilio uses a WhatsApp sandbox. Test guests need to send a one-time opt-in message to the sandbox number before they can receive OTPs.

### JWT Secret

Generate a secure secret and set it as `JWT_SECRET`:
```bash
openssl rand -hex 32
```

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Lint
```
