# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## General Principles

- **Never assume personal details.** Names, locations, dates, and preferences must come from the user — never inferred from context (e.g. username, phone format). When in doubt, ask before making a decision based on an assumption.

## Commands

```bash
npm run dev        # Start development server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint (runs eslint src/)
```

Node.js is installed via **nvm** on this machine. If `node`/`npm` are not found, source nvm first:
```bash
[ -s "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh"
```

There is no test suite yet. Validate API routes with curl (see Testing section below).

## Architecture

**Stack:** Next.js 15 (App Router, TypeScript, `src/` dir) · Tailwind CSS · shadcn/ui · Google Sheets (data store) · Twilio Verify (SMS/WhatsApp OTP) · JWT cookie sessions (`jose`)

**Hosting:** Vercel (target for production deployment)

**Routes:**
- `/` — Public save-the-date hero (Server Component); shows both events
- `/goyal` — Public save-the-date hero with Goyal family branding; shows both events
- `/reception` — Public save-the-date hero showing only the reception (Dec 5th) event; RSVP button links to `/login?mode=reception`
- `/login` — Phone entry + OTP flow (Server Component wrapper → `LoginPage` Client Component, 2-step state machine); accepts optional `?mode=` query param (`reception` or `flights`) that is threaded through the login flow and determines the post-auth redirect (`postLoginHref` in `constants.ts`) — `reception` redirects to `/invite?mode=reception`, `flights` redirects to `/flights`, anything else redirects to `/invite`
- `/invite` — Personalized save-the-date + RSVP form (Server Component, protected); accepts optional `?mode=reception` to show a reception-only view (single event section, two RSVP options). Guests with status `attending_both` always see the full form regardless of mode.
- `/flights` — Flight-details form for hotel check-in/check-out coordination (Server Component, protected); no RSVP-status gating, standalone URL (no link from `/invite`). Reads/writes the `Flights` sheet tab, copying `name`/`country_code`/`phone` from `Guests`.
- `/logout` — GET: handled by middleware — clears session cookie and redirects to `/`
- `/api/auth/login-id` — POST: check allowlist → send OTP via Twilio Verify (channel set by `OTP_CHANNEL`); if `OTP_CHANNEL=skip`, issues session immediately
- `/api/auth/pre-login-id` — GET: warms the Sheets phone cache before the user submits their phone number
- `/api/auth/login-otp` — POST: verify OTP → set `httpOnly` JWT cookie
- `/api/rsvp/submit` — POST: authenticated, writes RSVP data back to Google Sheets
- `/api/flights/submit` — POST: authenticated, upserts flight details into the `Flights` sheet tab (update if the guest's phone already has a row, append otherwise — never duplicates)

**Middleware** (`src/middleware.ts`) handles auth routing:
- `/logout` — clears session cookie, redirects to `/`
- `/invite` — redirects to `/login` if no valid JWT
- `/flights` — redirects to `/login?mode=flights` if no valid JWT
- `/login` — redirects to `/invite`, `/invite?mode=reception`, or `/flights` (via `postLoginHref`, based on the `mode` param) if a valid JWT exists

**`mode` query param (`reception` | `flights`):**
`mode` is the general "where should login send the guest, and how should `/invite` render" signal, built via `loginHref(mode)` / `postLoginHref(mode)` in `constants.ts`. `mode=reception` is a display-only toggle on `/invite` — no changes to the JWT, session, or Sheets schema; it hides the Indian Wedding (Dec 4th) event section and the `attending_both` RSVP option (`FAQSection` and `RSVPForm` both accept a `mode?: 'reception'` prop). `mode=flights` has no display effect — it only changes the post-login redirect target to `/flights`. Hero variants are configured in `src/config/heroVariants.ts`.

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/sheets.ts` | All Google Sheets I/O. The only file that calls `googleapis`. Guest data only — no event details. `Guests` phone→row map is cached (10-minute TTL, never invalidated — phone column is never modified). `Flights` phone→row map is deliberately **not** cached — that tab isn't pre-seeded and `upsertFlightDetails` appends rows, so every lookup reads live from Sheets to avoid racing a stale map into a duplicate row on concurrent submissions. Expected `/flights` traffic is low enough that the extra API call per lookup is a non-issue. |
| `src/lib/event.ts` | Synchronous config reader for event details (couple names, date, venue). Reads from env vars — no Sheets dependency. |
| `src/lib/auth.ts` | OTP send/verify via Twilio Verify. Re-exports JWT from `jwt.ts`. |
| `src/lib/jwt.ts` | JWT sign/verify via `jose`. Imported by middleware — must stay Edge-compatible (no Node.js-only imports). |
| `src/lib/session.ts` | Server-side helper: reads JWT from cookie via `next/headers`. |
| `src/lib/constants.ts` | Sheet column indices (0-indexed) and cookie/session config. |
| `src/lib/cdn.ts` | Public Vercel Blob store URLs for the hero background videos (`HERO_VIDEOS`); `hero.jpg` stays in `public/` and is served locally. |
| `scripts/upload-hero-media.mjs` | Local script: uploads a file to the public Blob store with a random suffix and 1-year `cacheControlMaxAge` — run via `npm run upload-hero-media -- <file...>`. |
| `src/types/index.ts` | Shared TypeScript types (Guest, EventDetails, RSVPData, SessionPayload, FlightData, FlightDetails). |

## Google Sheets Structure

Two tabs, both with a header in row 1, frozen.

### `Guests`

| Col | Name | Notes |
|-----|------|-------|
| A | `name` | Full name (admin fills before launch) |
| B | `country_code` | Country code digits only, no `+` prefix — e.g. `91`. Admin fills before launch. |
| C | `phone` | Subscriber number digits only — e.g. `9876543210`. Admin fills before launch. `sheets.ts` combines `country_code + phone` for lookups. |
| D | `email` | Guest email address (written by RSVP API) |
| E | `rsvp_status` | `attending_both` / `attending_5th` / `declined` / `pending` (written by API) |
| F | `guest_count` | Total attendees including the main guest (1–`MAX_GUEST_COUNT`, see `constants.ts`) |
| G | `plus_one_names` | Comma-separated names of additional guests |
| H | `rsvp_submitted_at` | ISO 8601 timestamp |
| I | `requires_parking` | `yes` / `no` |
| J | `requires_accommodation` | `yes` / `no` |
| K | `dietary_notes` | |
| L | `message` | Guest message |

### `Flights`

Not pre-seeded by the admin — rows only exist once a guest submits via `/flights`. One row per phone (upsert, never appended twice — see `upsertFlightDetails` in `sheets.ts`).

| Col | Name | Notes |
|-----|------|-------|
| A | `name` | Copied from `Guests` on every submit (self-heals if the guest's name is later corrected) |
| B | `country_code` | Copied from `Guests` |
| C | `phone` | Copied from `Guests`. Combined with `country_code` for lookups, same convention as `Guests` |
| D | `arrival_from` | Free text — city/airport the guest is flying from |
| E | `arrival_date` | `YYYY-MM-DD` |
| F | `arrival_time` | `HH:mm` |
| G | `arrival_flight_number` | |
| H | `departure_date` | `YYYY-MM-DD` |
| I | `departure_time` | `HH:mm` |
| J | `departure_flight_number` | |
| K | `message` | Optional free-text travel notes |
| L | `submitted_at` | ISO 8601 timestamp |

Event details (couple names, date, venue) are **not** stored in Sheets — they are static env var config read via `src/lib/event.ts`.

## Environment Variables

See `.env.example` for all required variables. Critical notes:
- `GOOGLE_PRIVATE_KEY`: in `.env.local` use `\n`-escaped single line; `sheets.ts` calls `.replace(/\\n/g, '\n')` to restore newlines. On Vercel, paste the raw multi-line PEM as-is.
- `TWILIO_VERIFY_SERVICE_SID`: created under Twilio Console → Verify → Services (not the Account SID).
- `OTP_CHANNEL`: `sms`, `whatsapp`, or `skip`. Controls OTP delivery. `skip` issues a session immediately without sending or verifying a code — operational escape hatch for OTP provider outages.
- `JWT_SECRET`: generate with `openssl rand -hex 32`.

## Auth Flow

**Normal flow:**
1. Guest enters phone number → `POST /api/auth/login-id` checks Sheets allowlist → sends OTP via Twilio Verify (sms or whatsapp, controlled by `OTP_CHANNEL`)
2. Guest enters 6-digit code → `POST /api/auth/login-otp` → verifies code → API issues 30-day `httpOnly` JWT cookie containing `{ phone }`
3. `/invite` reads cookie server-side via `getSession()` → fetches guest data from Sheets

**`OTP_CHANNEL=skip` (escape hatch):**
1. Guest enters phone → `POST /api/auth/login-id` checks Sheets allowlist → issues JWT session immediately (no OTP sent or verified)
2. Client receives `{ skipOtp: true }` and redirects directly to `/invite` — the OTP form is never shown

## Testing API Routes

```bash
# OTP_CHANNEL=sms or whatsapp:
# 1. Send OTP (must use a phone number in the Guests sheet)
curl -X POST http://localhost:3000/api/auth/login-id \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'
# 2. Verify OTP
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "code": "123456"}'

# OTP_CHANNEL=skip: step 1 issues session immediately, no step 2 needed
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login-id \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'

# Submit RSVP (uses session cookie from above)
curl -b cookies.txt -X POST http://localhost:3000/api/rsvp/submit \
  -H "Content-Type: application/json" \
  -d '{"email": "", "status": "attending_both", "guestCount": 1, "plusOneNames": "", "requiresParking": false, "requiresAccommodation": false, "dietaryNotes": "", "message": ""}'

# Submit flight details (uses session cookie from above; requires the Flights tab to exist)
curl -b cookies.txt -X POST http://localhost:3000/api/flights/submit \
  -H "Content-Type: application/json" \
  -d '{"arrivalFrom": "Mumbai", "arrivalDate": "2026-12-03", "arrivalTime": "14:30", "arrivalFlightNumber": "SQ423", "departureDate": "2026-12-06", "departureTime": "09:15", "departureFlightNumber": "SQ424", "message": ""}'
```

## PR Workflow

**Never push directly to `main`. No exceptions — not even for docs, typos, or one-liners.**

Always follow these steps when delivering any change, no matter how small:

1. **Create a branch** — branch off `main` with a descriptive name (e.g. `feat/...`, `fix/...`, `chore/...`)
2. **Restart the server** — run `/restart-server` so the user can test the changes before they are committed
3. **Commit** — stage only relevant files; write a clear commit message explaining the *why*
4. **Push & open a PR** — push the branch and create a PR via `gh pr create`
5. **Review** — run `gh pr diff <number>` and do a self-review before considering the work done; flag any issues in the PR description
6. **Stop and wait** — do not merge until the user explicitly says to merge
7. **Merge** — use `gh pr merge <number> --merge --delete-branch` to preserve the full commit history and delete the branch. Never squash.

## Pending Work

`TODO.md` tracks outstanding fixes and planned work. Always check it when opening or reviewing a PR — reference relevant items in the PR description or review comments.

## Code Style

- **Prefer early returns** to reduce nesting and keep the happy path unindented. Return or throw as soon as a condition is known; don't wrap the rest of the function in an `else`.
  ```typescript
  // correct
  if (!guest) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  // ... continue with guest

  // wrong
  if (guest) {
    // ... everything indented inside
  }
  ```

- **Always use curly braces for `if`/`else` blocks**, even single-line bodies. The body goes on the next line.
  ```typescript
  // correct
  if (!token) {
    return null;
  }

  // wrong
  if (!token) return null;
  ```
  This is enforced by the `curly: ['error', 'all']` ESLint rule in `eslint.config.mjs`.

## Hero Videos

Background videos are hosted on a public Vercel Blob store and listed as full URLs in `HERO_VIDEOS` inside `src/lib/cdn.ts` (imported by `ScrollBackground.tsx`). They play sequentially with a crossfade and loop back to the start. `hero.jpg` is the only hero asset that stays in `public/` — it's small and preloaded on every page, so local serving is fine.

**Adding a new video:**
1. Encode it into `public/` as `.mp4` (see ffmpeg command below) — `public/*.mp4` is gitignored, so the file stays local for future re-encoding/re-uploading without being tracked or shipped in the deploy bundle
2. If converting from `.mov`, encode it first — raw `.mov` files are not supported in Chrome/Firefox
3. Run `npm run upload-hero-media -- public/<file>.mp4` (requires `BLOB_READ_WRITE_TOKEN` in `.env.local` — see `.env.example`) and copy the printed URL
4. Paste the URL into `HERO_VIDEOS` in `src/lib/cdn.ts`

**Required ffmpeg encoding** (H.265/HEVC, 1920-wide, no audio, CRF 28 for web-appropriate file size):
```bash
ffmpeg -i input.mov -vcodec libx265 -crf 28 -an -tag:v hvc1 -vf scale=1920:-2 output.mp4
```
Always use `-crf 28`. Omitting it preserves the source bitrate, which can be 3–5× larger than necessary. `-vf scale=1920:-2` caps width at 1920px while preserving the source aspect ratio (the `-2` ensures height is divisible by 2, required by H.265). Never use `-acodec` — these are muted background videos. `-tag:v hvc1` is required for Safari/iOS compatibility. Firefox has no H.265 support and falls back to `hero.jpg` gracefully.

## Important Patterns

- **sheets.ts auth client**: `authClient` is a module-level singleton (persists across warm Vercel invocations so the internal OAuth token cache is reused). `getSheetsClient()` is a thin factory that wraps it per-call.
- **Column index map**: `GUEST_COLS` (and `FLIGHT_COLS` for the `Flights` tab) in `constants.ts` is the single source of truth for column positions. If a column is added to a Sheet tab, update only this file.
- **Max party size**: `MAX_GUEST_COUNT` in `constants.ts` is the single source of truth for the guest count cap, enforced in both the RSVP form UI (`RSVPForm.tsx`) and the submit API's zod schema (`api/rsvp/submit/route.ts`).
- **API responses never expose** internal data: `login-otp` only returns `{ success: true }`, RSVP data is written server-side from the JWT session.
- **shadcn/ui components** live in `src/components/ui/` (auto-generated by `npx shadcn add`).
