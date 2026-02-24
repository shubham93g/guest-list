# guest-list

Wedding guest management website — save the date, OTP authentication, RSVP, and guest management via Google Sheets.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS**
- **Google Sheets** — primary data store
- **Twilio Verify** — SMS or WhatsApp OTP (when `OTP_CHANNEL=sms` or `whatsapp`)
- **Resend** — email OTP (when `OTP_CHANNEL=email`)
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
Fill in `.env.local`. See the [External Services](#external-services) section for credentials.

**3. Start the development server**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## Skip OTP (`OTP_CHANNEL=skip`)

`OTP_CHANNEL=skip` is a valid first-class configuration — not just an emergency fallback. Use it when you don't need OTP verification: guests you fully trust, internal previews, or events where the guest list itself is the only gate.

```
OTP_CHANNEL=skip
```

**What it does:** the guest enters their identifier as usual, it is validated against the real guest list, and a session is issued immediately — no OTP is sent or verified. Guests not on the list still get a 422 error; the allowlist check is never skipped.

**When to use it:** any time OTP is unnecessary or undesirable — not just during outages. Also useful as a fallback if the OTP provider (Twilio or Resend) goes down: toggle it on Vercel by updating the env var and triggering a redeploy, then revert once the provider recovers.

**What it is not:** a substitute for real credentials. Real Google Sheets credentials are required to run the app.

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
| C | `email` | Guest email address (admin fills before launch) |
| D | `rsvp_status` | Written by API: `attending` / `declined` |
| E | `rsvp_submitted_at` | ISO 8601 timestamp |
| F | `dietary_notes` | |
| G | `plus_one_attending` | `yes` / `no` |
| H | `plus_one_name` | |
| I | `notes` | Guest message |

Event details (couple names, date, venue) are configured in `src/config/wedding.ts`, not stored in Sheets.

### Twilio Verify (OTP_CHANNEL=sms or whatsapp)

1. Sign up at [twilio.com](https://twilio.com)
2. Copy **Account SID** and **Auth Token** → `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
3. Go to Verify → Services → **Create new service**
4. Copy the **Service SID** → `TWILIO_VERIFY_SERVICE_SID`
5. Set `OTP_CHANNEL`:
   - `sms` — works immediately on a trial account; no additional setup
   - `whatsapp` — requires enabling the WhatsApp channel on the Verify Service and a Meta-approved WhatsApp Business Account

Also set `RSVP_CHANNEL=phone` (or leave it at the default).

### Resend (OTP_CHANNEL=email)

Resend is a transactional email API. The API key is scoped to send-only and can be revoked from the Resend dashboard without changing your Google account.

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your sending domain (DNS records)
3. Go to **API Keys** → **Create API Key** → select **Sending access** only
4. Copy the key → `RESEND_API_KEY`
5. Set `RESEND_FROM` to a sender address on your verified domain (e.g. `invite@yourdomain.com`)
6. Set `OTP_CHANNEL=email` and `RSVP_CHANNEL=email`

### JWT Secret

Generate a secure secret and set it as `JWT_SECRET`:
```bash
openssl rand -hex 32
```

## Customising Content

### Wedding details

All wedding details live in one file — `src/config/wedding.ts`. Edit it directly before launch:

```ts
export const wedding = {
  coupleNames: 'Alex & Jordan',
  date: 'November 15, 2025',
  day: 'Saturday',
  time: '6:00 PM IST',
  venueName: 'The Grand Ballroom',
  venueCity: 'Mumbai',
  venueAddress: '123 Marine Drive, Mumbai 400001',
  datetimeISO: '2025-11-15T18:00:00+05:30', // leave '' to hide Add to Calendar
};
```

No env vars needed — restart the dev server (or redeploy) after saving.

### FAQ

Edit the `faqs` array in `src/components/landing/FAQSection.tsx`. Each item is a plain `{ q, a }` object. Replace the `[bracketed]` placeholders with your actual answers before launch.

### Background photos

The landing page uses two full-screen background photos — one for the hero section and one for the venue section. Both are configured at the top of `src/components/landing/ScrollBackground.tsx`:

```ts
const HERO_IMAGE = 'https://...';  // couple photo
const VENUE_IMAGE = 'https://...'; // venue exterior
```

**Recommended specs:**

| | Requirement | Notes |
|-|------------|-------|
| **Orientation** | Landscape (wider than tall) | Portrait photos are cropped heavily on desktop because `background-size: cover` scales to fill the viewport width |
| **Aspect ratio** | 16:9 or wider | Matches typical desktop viewport proportions |
| **Minimum width** | 1920 px | Prevents visible pixelation on large screens; 2400–3000 px ideal for retina displays |
| **File size** | Under 500 KB | Compress before upload — large photos noticeably delay the first paint |
| **Format** | JPEG | Better compression than PNG for photographs |

**Recommended workflow:** shoot or source a landscape photo → compress with [Squoosh](https://squoosh.app) targeting ≤ 400 KB → place in `public/images/` → update the URL to `/images/your-photo.jpg`.

**CSP note:** if you host photos in `/public` (same origin), no config changes are needed. If you load them from an external CDN, add that hostname to the `img-src` directive in `next.config.ts`:

```ts
"img-src 'self' data: https://your-cdn.com",
```

The current placeholder Pexels images already have `https://images.pexels.com` added for this reason. Remove it once you replace them with self-hosted photos.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # ESLint (runs eslint src/)
```

## Deployment

The app deploys to **Vercel** (free Hobby plan) via native GitHub integration — no CI/CD config files needed. Every push to `main` auto-deploys to production; every PR gets a preview URL.

### 1. Create Vercel project

1. Go to [vercel.com](https://vercel.com) → sign up or log in with your GitHub account
2. Click **"Add New Project"** → find and import this GitHub repository
3. Vercel will detect Next.js automatically — leave build settings as-is
4. Skip the env vars screen for now; configure them in the next step

### 2. Configure environment variables

In the Vercel project → **Settings → Environment Variables**, add each variable from `.env.example`. Set scope to **Production** and **Preview**.

> **`GOOGLE_PRIVATE_KEY`**: paste the raw multi-line PEM directly — no `\n` escaping needed in the Vercel dashboard (unlike `.env.local`).

After saving all variables, trigger a redeploy: **Deployments → ⋯ → Redeploy**.

### 3. Connect your custom domain

**In Vercel:** Project → **Settings → Domains** → Add your domain (e.g. `yourdomain.com`)

**In GoDaddy DNS** (keep GoDaddy as your DNS provider — don't change nameservers, as existing email DNS records live there):

| Type | Host | Value |
|------|------|-------|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

Vercel will issue a TLS certificate automatically once it detects the records. DNS propagation takes 1–48 hours.

### Verification

- Vercel **Domains** tab shows a green **Valid Configuration** badge
- Visit your domain → app loads
- Open a PR → Vercel posts a preview URL comment on the PR
- Merge to `main` → Vercel dashboard shows a new production deployment
- Test the full flow: identifier → OTP → `/invite` → RSVP submission

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
