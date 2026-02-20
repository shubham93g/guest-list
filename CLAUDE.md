# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start development server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint
```

There is no test suite yet. Validate API routes with curl (see Testing section below).

## Architecture

**Stack:** Next.js 14 (App Router, TypeScript, `src/` dir) · Tailwind CSS · shadcn/ui · Google Sheets (data store) · Twilio Verify (WhatsApp OTP) · JWT cookie sessions (`jose`)

**Routes:**
- `/` — Public save-the-date hero (Server Component)
- `/verify` — Phone entry + OTP flow (Client Component, 2-step state machine)
- `/welcome` — Personalized save-the-date + RSVP form (Server Component, protected)
- `/api/auth/send-otp` — POST: check allowlist → send WhatsApp OTP via Twilio Verify
- `/api/auth/verify-otp` — POST: verify OTP → set `httpOnly` JWT cookie
- `/api/rsvp/submit` — POST: authenticated, writes RSVP data back to Google Sheets

**Middleware** (`src/middleware.ts`) guards `/welcome` — redirects to `/verify` if no valid JWT.

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/sheets.ts` | All Google Sheets I/O. The only file that calls `googleapis`. Guest data only — no event details. |
| `src/lib/event.ts` | Synchronous config reader for event details (couple names, date, venue). Reads from env vars — no Sheets dependency. |
| `src/lib/auth.ts` | Twilio Verify OTP send/check. Re-exports JWT functions from `jwt.ts`. |
| `src/lib/jwt.ts` | JWT sign/verify via `jose`. Imported by middleware — must stay Edge-compatible (no Node.js-only imports). |
| `src/lib/session.ts` | Server-side helper: reads JWT from cookie via `next/headers`. |
| `src/lib/constants.ts` | Sheet column indices (0-indexed) and cookie/session config. |
| `src/types/index.ts` | Shared TypeScript types (Guest, EventDetails, RSVPData, SessionPayload). |

## Google Sheets Structure

One tab only: **`Guests`** (header in row 1, frozen)

| Col | Name | Notes |
|-----|------|-------|
| A | `name` | Full name (admin fills before launch) |
| B | `phone` | E.164 format e.g. `+919876543210`. Auth identifier. |
| C | `rsvp_status` | `attending` / `declined` (written by API) |
| D | `rsvp_submitted_at` | ISO 8601 timestamp |
| E | `dietary_notes` | |
| F | `plus_one_attending` | `yes` / `no` |
| G | `plus_one_name` | |
| H | `notes` | Guest message |

Event details (couple names, date, venue) are **not** stored in Sheets — they are static env var config read via `src/lib/event.ts`.

## Environment Variables

See `.env.example` for all required variables. Critical notes:
- `GOOGLE_PRIVATE_KEY`: in `.env.local` use `\n`-escaped single line; `sheets.ts` calls `.replace(/\\n/g, '\n')` to restore newlines. On Vercel, paste the raw multi-line PEM as-is.
- `TWILIO_VERIFY_SERVICE_SID`: created under Twilio Console → Verify → Services (not the Account SID).
- `JWT_SECRET`: generate with `openssl rand -hex 32`.

## Auth Flow

1. Guest enters phone → `POST /api/auth/send-otp` checks Sheets allowlist → sends WhatsApp OTP via Twilio Verify
2. Guest enters 6-digit code → `POST /api/auth/verify-otp` → Twilio confirms → API issues 30-day `httpOnly` JWT cookie
3. `/welcome` reads cookie server-side via `getSession()` → fetches guest data from Sheets

## Testing API Routes

```bash
# 1. Send OTP (must use a phone number in the Guests sheet)
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'

# 2. Verify OTP (use code received on WhatsApp)
curl -c cookies.txt -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "code": "123456"}'

# 3. Submit RSVP (uses session cookie from step 2)
curl -b cookies.txt -X POST http://localhost:3000/api/rsvp/submit \
  -H "Content-Type: application/json" \
  -d '{"status": "attending", "dietaryNotes": "vegetarian", "plusOneAttending": false, "plusOneName": "", "notes": ""}'
```

## Mock Mode

Mock mode bypasses all external integrations (Google Sheets, Twilio) so the full UX flow can be tested without credentials.

**Toggle in `.env.local`:**
```bash
MOCK_MODE=true               # server-side: skips Sheets + Twilio
NEXT_PUBLIC_MOCK_MODE=true   # client-side: shows amber hint banners in the UI
```

**Mock flow behaviour:**
- Any phone number is accepted on `/verify`
- OTP code is always `000000`
- `/welcome` shows the guest configured via `MOCK_GUEST_NAME` env var
- RSVP submit logs to the console instead of writing to Sheets

**Mock mode only covers guest lookup and WhatsApp OTP** — event details (couple names, date, venue) are always read from env vars and are never mocked. `mock.ts` reads from `MOCK_GUEST_NAME` for the guest name. See `.env.example` for the full list.

**Mock mode must always work.** When adding new features that touch external services (Sheets, Twilio, future WhatsApp blasts), always add a corresponding mock branch gated on `MOCK_MODE`. Every new API route or server action that calls an external service must short-circuit cleanly when `MOCK_MODE=true`. This ensures the UX can always be previewed and developed without live credentials.

## Pending Work

See `TODO.md` for a prioritised list of outstanding tasks:
- **Code review fixes** — phone validation, JWT type safety, rate limiting, typo, and cleanup items
- **Tests to write** — unit tests for `jwt.ts`, `mock.ts`, `sheets.ts`, `event.ts`; API route tests for all three endpoints; integration/E2E tests for the mock-mode happy path and middleware

## Important Patterns

- **sheets.ts auth client**: uses a factory function `getAuthClient()` — not a module-level singleton — to be safe in serverless environments.
- **Column index map**: `GUEST_COLS` in `constants.ts` is the single source of truth for column positions. If a column is added to the Sheet, update only this file.
- **API responses never expose** internal data: `verify-otp` only returns `{ success: true }`, RSVP data is written server-side from the JWT session.
- **shadcn/ui components** live in `src/components/ui/` (auto-generated by `npx shadcn add`).
