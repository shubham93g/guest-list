# guest-list

A private wedding website with OTP-gated RSVP, personalized guest invitations, and Google Sheets as the data store.

## Features

- Public save-the-date landing page — looping hero video, venue details, and FAQ
- Personalized `/invite` page, unlocked per guest via OTP auth
- RSVP form with dietary notes, plus-one, and a message field; returning guests see their prior response
- `/flights` form collects each guest's arrival/departure flight details, so the hotel can be briefed on check-in/check-out timing
- Multi-channel OTP: SMS or WhatsApp — configurable per deployment without code changes
- iCal export so guests can add the event to their calendar
- Guest data lives in Google Sheets — admin-accessible without a separate dashboard
- WhatsApp message campaigns (e.g. reminders) sent from a local script, templated per RSVP status and tracked in the Sheet — see [WhatsApp messages](#whatsapp-messages)

## Stack

| Technology | Role | Notable detail |
|---|---|---|
| Next.js 15 (App Router) | Full-stack framework | Server Components for per-guest personalization; Edge-compatible middleware for auth routing |
| TypeScript | Type safety | Strict mode; branded types for domain values (e.g. `ISOTimestamp`) |
| Tailwind CSS + shadcn/ui | Styling and components | — |
| Google Sheets | Guest data store | Keeps data admin-accessible; avoids standing up a database for a single-event app |
| Twilio Verify | SMS / WhatsApp OTP | Managed OTP delivery with no token storage required |
| jose | JWT sessions | Edge-compatible (no Node.js-only APIs); required for use in middleware |
| Zod | Input validation | All API request bodies validated at the boundary |
| Vercel | Hosting + CI | Native GitHub integration; preview URLs per PR |

## Architecture

Public-facing routes: `/` (landing), `/login` (phone + OTP entry), `/invite` (personalized RSVP), and `/flights` (flight-detail collection for hotel logistics). Auth routing is handled in Edge middleware — a valid JWT redirects away from `/login` to `/invite` or `/flights` depending on the `mode` query param, a missing JWT redirects away from `/invite`/`/flights` back to `/login` — keeping route handlers clean.

The Google Sheets client uses a factory pattern (one auth client per invocation) for serverless safety. Guest lookups sit behind a 10-minute in-memory cache, never invalidated since the phone columns are never modified after admin setup. Flight-detail lookups on `/flights` are deliberately uncached — that sheet only grows via guest submissions (an admin-static assumption doesn't hold there), so every check reads Sheets live to keep the one-row-per-phone guarantee accurate even under near-simultaneous submissions. API routes handle auth, RSVP submission, and flight-detail submission; event details (couple names, date, venue) live in `src/config/wedding.ts` as static config — not in the Sheet.

## Auth and OTP

Guests log in with their phone number. OTP delivery is controlled by `OTP_CHANNEL`:

| `OTP_CHANNEL` | Delivery | Notes |
|---|---|---|
| `sms` | Twilio Verify | Default for live deployments |
| `whatsapp` | Twilio Verify (WhatsApp) | Requires Meta-approved WhatsApp Business Account |
| `skip` | None | Valid first-class mode — see below |

**`OTP_CHANNEL=skip`** issues a session immediately after the allowlist check passes — no code is sent or verified. Guests not on the list still get a 422. Useful for trusted guest lists or as an operational fallback if the OTP provider goes down (toggle in Vercel env vars, redeploy, revert when the provider recovers — no code changes).

## Security

- **Rate limiting**: in-memory sliding window; per-IP and per-phone on `login-id`, per-identifier on `login-otp` (5/10 min), per-identifier on RSVP and flight-detail submission (10/15 min each)
- **Anti-enumeration**: `login-id` and `login-otp` return identical error messages for format validation failures and not-found errors
- **HTTP security headers**: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `HSTS` applied to all routes via `next.config.ts`
- **CSP** (production only): allowlisted `script-src`, `style-src`, `img-src`, `connect-src`; `frame-ancestors 'none'`
- **Sessions**: `httpOnly` JWT cookie, 30-day expiry, `Secure` flag in production
- **API responses**: `login-otp` returns only `{ success: true }`; guest data is read server-side from the JWT — nothing is echoed to the client

## Deployment and CI

Hosted on Vercel (Hobby plan). No `vercel.json` needed — Next.js is detected automatically. GitHub integration handles CI: every push to `main` deploys to production, every PR gets a preview URL. Lint errors surface as failed deployments. Environment variables are configured in the Vercel dashboard.

## Setup

```bash
npm install
cp .env.example .env.local  # fill in credentials
npm run dev                  # http://localhost:3000
```

All required variables are documented in `.env.example`. Key notes:
- `JWT_SECRET` — generate with `openssl rand -hex 32`
- `OTP_CHANNEL` defaults to `skip` — set to `sms` or `whatsapp` for live OTP delivery

## Customising

| What | Where |
|---|---|
| Wedding details (names, date, venue) | `src/config/wedding.ts` |
| FAQ content | `faqs` array in `src/components/landing/FAQSection.tsx` |
| Hero videos | encode into `public/` (gitignored), `npm run upload-hero-media`, then update `HERO_VIDEOS` in `src/lib/cdn.ts` with the printed URL |
| Venue background photo | URL at the top of `src/components/landing/ScrollBackground.tsx` |

**Hero video format:** the file must be H.265 (HEVC) MP4, scaled to 1920px wide. Convert with:

```bash
ffmpeg -i input.mov \
  -vcodec libx265 -an \
  -tag:v hvc1 \
  -vf scale=1920:-2 \
  -crf 28 \
  public/hero.mp4
```

`-crf 28` is a good quality/size trade-off for a background video (lower = better quality, larger file). `-vf scale=1920:-2` caps width at 1920px while preserving the source aspect ratio. `-tag:v hvc1` is required for Safari/iOS compatibility. The encoded files live in `public/` for local access (gitignored — see `.gitignore`) and are uploaded to a public Vercel Blob store via `npm run upload-hero-media`; each upload gets a random suffix and a 1-year `Cache-Control: max-age`, so the resulting content-addressed URL can be cached by the browser indefinitely — a re-encoded file gets a new URL, so there's no staleness risk. Firefox has no H.265 support and falls back to the static `hero.jpg` background gracefully.

## WhatsApp messages

Guests can be sent WhatsApp messages (e.g. a "less than a month to go" reminder) from a local script using the Meta WhatsApp Cloud API. Each send is a **campaign**: the script picks a Meta-approved template per guest based on their RSVP status, and tracks who was sent what in a dedicated tab of the Google Sheet. The scripts only ever **read** the `Guests` tab — they never write to it.

### One-time setup

1. Add the WhatsApp secrets to `.env.local` (see `.env.example` for where to find each one):
   ```
   WHATSAPP_ACCESS_TOKEN=     # permanent System User token
   WHATSAPP_PHONE_NUMBER_ID=  # the numeric ID from API Setup, not the phone number
   WHATSAPP_PIN=              # 6-digit two-step verification PIN you choose
   ```
   The `GOOGLE_*` variables used by the app are also needed.
2. Check the business number is ready — `status` should be `CONNECTED`:
   ```bash
   npm run whatsapp-setup -- status
   ```
   If it's `PENDING`, run `npm run whatsapp-setup -- register` (requires the WhatsApp Business Account to have passed Meta's review).
3. Create the templates in [WhatsApp Manager → Message templates](https://business.facebook.com/wa/manage/message-templates/) and wait until they show **Active**. Templates take one body variable, `{{1}}`, which is filled with the guest's name.

To send one template to a single number as a test:
```bash
npm run whatsapp-setup -- test <phone> <template> en <name>
# e.g. npm run whatsapp-setup -- test 6591234567 wedding_reminder_both_v2 en Alex
```
`<phone>` is country code + number, digits only.

### Running a campaign

Campaigns are defined in `scripts/whatsapp-campaigns.mjs`. Replace `<campaign>` below with a campaign key from that file (e.g. `reminder_1_month`). Every command accepts `--dry-run` to preview without writing to the Sheet or sending anything.

**1. Prepare the campaign tab**
```bash
npm run whatsapp-messages -- prepare <campaign>
```
Builds the campaign's tab (e.g. `WA_reminder_1_month`) with one row per guest — including guests with no phone number — and prints how many guests will be sent each template, how many are excluded and why, and the names of any guests missing a phone.

Guests who can't be messaged get their `exclude` filled in automatically:
- `no phone` — no phone number in `Guests`
- `no template` — they're `declined` or `pending`
- `unknown rsvp status` — any other RSVP status this campaign has no template for (e.g. `attending_4th`, or a mistyped status in `Guests`)

**`prepare` overwrites the whole tab every time**, including any edits you made in step 2. Re-run it freely (e.g. after more RSVPs come in) until you start sending — but make your manual edits *after* your last `prepare`. Once anything has been sent, `prepare` refuses to run, since wiping the send results would let the next `send` message everyone again. To start a campaign over completely, delete its tab and run `prepare`.

**2. Review the tab in Google Sheets.** Edit only these columns:

| Column | What to do |
|---|---|
| `exclude` | **The single place that decides who's skipped** — any value skips the guest. Type `yes` to skip someone manually. `prepare` fills in `no phone`, `no template` or `unknown rsvp status` automatically (see above) |
| `template` | Change the template name to send that guest a different template than the automatic one (if the row was excluded for having no template, also clear its `exclude`) |
| `greeting_name` | The name used in `{{1}}` — pre-filled with the guest's name; change it (e.g. to a first name) as needed |

Don't add, remove, rename or reorder columns — every command checks the header row and stops if the layout has changed.

**3. Preview, then send**
```bash
npm run whatsapp-messages -- send <campaign> --dry-run   # list exactly who gets which template
npm run whatsapp-messages -- send <campaign>             # same list, then asks "Send now? (y/N)"
```
Results are written back to the tab:

| Column | Meaning |
|---|---|
| `status` | `sent` or `failed` |
| `message_id` | WhatsApp message ID (on success) |
| `error` | Meta's error code and reason (on failure) |
| `attempted_at` | When the last attempt was made |

`sent` means Meta accepted the message — it doesn't confirm delivery (e.g. if the number isn't on WhatsApp).

**4. Retry failures**
```bash
npm run whatsapp-messages -- retry <campaign>
```
Resends only rows with `status = failed`. Running `send` again is also safe — rows already `sent` are always skipped, so nobody gets the same campaign twice.

**Tip — test on yourself first:** after `prepare`, set `exclude` to `yes` for everyone except yourself (leave the automatic values alone), run `send`, check the message on your phone, then clear only the `yes` cells you added and `send` again for everyone else.

### Adding a new campaign

1. Create and get the new template(s) approved in WhatsApp Manager.
2. Add an entry to `scripts/whatsapp-campaigns.mjs`:
   ```js
   reminder_1_week: {
     tab: 'WA_reminder_1_week',   // a new, dedicated tab — never Guests or Flights
     language: 'en',              // must match the template's language
     templates: {
       attending_both: 'your_both_days_template',
       attending_5th:  'your_reception_template',
       // RSVP statuses not listed get no message
     },
   },
   ```
3. Run `prepare` / `send` with the new campaign key. Previous campaign tabs are left untouched.

### Limits and troubleshooting

- **Messaging limit:** the number can start conversations with a limited number of unique recipients per rolling 24 hours (250 on the starting tier). The script warns if a send exceeds it; anything over the limit fails and can be `retry`'d the next day.
- **Common errors** (shown in the `error` column):

| Error | Fix |
|---|---|
| `132001` template does not exist | Template name or `language` doesn't match an **Active** template in WhatsApp Manager |
| `132000` parameter mismatch | The template has a different number of variables than `{{1}}` |
| `131026` / `131047` | Number can't receive the message (not on WhatsApp, or outside the 24-hour reply window for non-template messages) |
| `131048` / `130429` | Rate or spam limit hit — wait, then `retry` |
| `190` | Access token expired or invalid — generate a new System User token |

## Commands

```bash
npm run dev                # Start dev server (localhost:3000)
npm run build              # Production build
npm run lint               # ESLint (runs eslint src/)
npm run whatsapp-setup     # WhatsApp number onboarding + single test sends (see WhatsApp messages)
npm run whatsapp-messages  # WhatsApp campaigns: prepare / send / retry (see WhatsApp messages)
```
