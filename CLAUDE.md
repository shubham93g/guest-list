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
- `/` — Public save-the-date hero (Server Component)
- `/login` — Phone entry + OTP flow (Server Component wrapper → `LoginPage` Client Component, 2-step state machine)
- `/invite` — Personalized save-the-date + RSVP form (Server Component, protected)
- `/logout` — GET: clears session cookie and redirects to `/` (browser-navigable)
- `/api/auth/send-otp` — POST: check allowlist → send OTP via Twilio Verify (channel set by `OTP_CHANNEL`)
- `/api/auth/login-otp` — POST: verify OTP → set `httpOnly` JWT cookie
- `/api/rsvp/submit` — POST: authenticated, writes RSVP data back to Google Sheets

**Middleware** (`src/middleware.ts`) handles auth routing for both protected routes:
- `/invite` — redirects to `/login` if no valid JWT
- `/login` — redirects to `/invite` if a valid JWT exists (skips unnecessary re-auth)

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/sheets.ts` | All Google Sheets I/O. The only file that calls `googleapis`. Owns `MOCK_SHEETS` flag and mock behaviour. Guest data only — no event details. Caches guest rows in memory (5-minute TTL); invalidated on `updateGuestRSVP`. |
| `src/lib/event.ts` | Synchronous config reader for event details (couple names, date, venue). Reads from env vars — no Sheets dependency. |
| `src/lib/auth.ts` | Twilio Verify OTP send/check. Owns `MOCK_OTP` flag and mock behaviour. Re-exports JWT functions from `jwt.ts`. |
| `src/lib/jwt.ts` | JWT sign/verify via `jose`. Imported by middleware — must stay Edge-compatible (no Node.js-only imports). |
| `src/lib/session.ts` | Server-side helper: reads JWT from cookie via `next/headers`. |
| `src/lib/constants.ts` | Sheet column indices (0-indexed) and cookie/session config. |
| `src/types/index.ts` | Shared TypeScript types (Guest, EventDetails, RSVPData, SessionPayload). |

## Google Sheets Structure

One tab only: **`Guests`** (header in row 1, frozen)

| Col | Name | Notes |
|-----|------|-------|
| A | `name` | Full name (admin fills before launch) |
| B | `phone` | Digits only, no `+` prefix — e.g. `919876543210`. Google Sheets strips `+` even in Plain Text cells. `sheets.ts` normalises by stripping `+` before comparing. |
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
- `OTP_CHANNEL`: `sms` (default) or `whatsapp`. WhatsApp requires a Meta-approved WhatsApp Business Account on the Verify Service.
- `JWT_SECRET`: generate with `openssl rand -hex 32`.

## Auth Flow

1. Guest enters phone → `POST /api/auth/send-otp` checks Sheets allowlist → sends OTP via Twilio Verify (channel: `OTP_CHANNEL`, default `sms`)
2. Guest enters 6-digit code → `POST /api/auth/login-otp` → Twilio confirms → API issues 30-day `httpOnly` JWT cookie
3. `/invite` reads cookie server-side via `getSession()` → fetches guest data from Sheets

## Testing API Routes

```bash
# 1. Send OTP (must use a phone number in the Guests sheet)
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'

# 2. Verify OTP (use code received via SMS or WhatsApp depending on OTP_CHANNEL)
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "code": "123456"}'

# 3. Submit RSVP (uses session cookie from step 2)
curl -b cookies.txt -X POST http://localhost:3000/api/rsvp/submit \
  -H "Content-Type: application/json" \
  -d '{"status": "attending", "dietaryNotes": "vegetarian", "plusOneAttending": false, "plusOneName": "", "notes": ""}'
```

## Mock Mode

Each external service can be mocked independently, allowing integration testing against one real service while bypassing the other.

**Flags in `.env.local`:**
```bash
MOCK_SHEETS=true             # bypass Google Sheets: skip allowlist check, RSVP writes log to console
MOCK_OTP=true                # bypass OTP sending/verification (any 6-digit code is accepted)
MOCK_SHEETS_GUEST_NAME=      # guest name returned for all lookups when MOCK_SHEETS=true
```

**Mock flow behaviour:**
- `MOCK_SHEETS=true` — any phone number passes the allowlist check; `/invite` shows the guest configured via `MOCK_SHEETS_GUEST_NAME`; RSVP writes log to the console instead of updating Sheets
- `MOCK_OTP=true` — no OTP message is sent; any 6-digit code is accepted; OTPForm shows "Mock mode active" (driven by API response, not client env var)
- Both flags can be set together for a fully credential-free local flow

**Mock mode design principles:**
- **Server-side only.** Mock configuration lives in server env vars — no `NEXT_PUBLIC_MOCK_*` vars. The client never reads mock state from the environment.
- **API-driven UI hints.** When a mock flag is active, the relevant API response includes `mock: true`. The client uses this field to show a simple indicator — no hardcoded values or debug logic in the UI.
- **Single source of truth.** The server owns mock state; the client reflects it.

**Mock mode must always work.** When adding new features that touch external services (Sheets, OTP/auth, future integrations), add mock handling inside the relevant service module (`sheets.ts` for Sheets, `auth.ts` for OTP). API routes should never contain mock flag checks — mock behaviour is encapsulated in the service layer.

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

- **Mock paths use early returns.** Mock handling lives in service modules (`auth.ts`, `sheets.ts`). Check `if (MOCK_X)` first and return from the mock path before the real implementation.
  ```typescript
  // correct — inside auth.ts
  export async function verifyOTP(phone: string, code: string): Promise<boolean> {
    if (MOCK_OTP) {
      return true;
    }
    // real Twilio call
  }

  // wrong — mock logic leaking into routes
  if (!MOCK_OTP) {
    const approved = await verifyOTP(phone, code);
    // ...
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

## Important Patterns

- **sheets.ts auth client**: uses a factory function `getAuthClient()` — not a module-level singleton — to be safe in serverless environments.
- **Column index map**: `GUEST_COLS` in `constants.ts` is the single source of truth for column positions. If a column is added to the Sheet, update only this file.
- **API responses never expose** internal data: `login-otp` only returns `{ success: true }`, RSVP data is written server-side from the JWT session.
- **shadcn/ui components** live in `src/components/ui/` (auto-generated by `npx shadcn add`).
