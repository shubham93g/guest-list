# TODO

## Code Review Fixes

### Should Fix (before real guests)

- [ ] **Rate limiting on `send-otp`** — `src/app/api/auth/send-otp/route.ts`
  Prevent endpoint spam that burns Twilio credits. Options: Vercel rate limiting,
  or a simple IP-based check middleware.

- [ ] **Cache guest list to reduce Sheets reads** — `src/lib/sheets.ts`
  `findGuestByPhone` fetches all rows on every call. Cache the guest list in
  memory (or via Next.js `unstable_cache`) with a short TTL (e.g. 5 min) so
  repeated OTP attempts and page loads don't hammer the Sheets API.
  Invalidate on `updateGuestRSVP` to avoid serving stale RSVP status.

---

## Tests to Write

### Unit Tests

- [ ] **`src/lib/jwt.ts`**
  - `signJWT` returns a non-empty string
  - `verifyJWT` returns correct payload for a valid token
  - `verifyJWT` returns `null` for an expired token
  - `verifyJWT` returns `null` for a tampered token
  - `verifyJWT` returns `null` for a garbage string
  - `getJWTSecret` throws if `JWT_SECRET` env var is missing

- [ ] **`src/lib/sheets.ts`** (mock mode only — no real Sheets calls in unit tests)
  - `findGuestByPhone` returns mock guest with the given phone when `MOCK_SHEETS=true`
  - `findGuestByPhone` mock guest name falls back to `'Guest Name'` when `MOCK_SHEETS_GUEST_NAME` is unset
  - `updateGuestRSVP` logs to console (no throw) when `MOCK_SHEETS=true`

- [ ] **`src/lib/auth.ts`** (mock mode only)
  - `sendOTP` returns `{ mock: true }` and skips Twilio when `MOCK_TWILIO=true`
  - `verifyOTP` returns `true` for any code when `MOCK_TWILIO=true`

- [ ] **`src/lib/event.ts`**
  - `getEventDetails` returns values from env vars
  - `getEventDetails` returns empty strings when env vars are unset

### API Route Tests

- [ ] **`POST /api/auth/send-otp`**
  - Returns 400 for missing phone
  - Returns 400 for invalid phone format (no `+`, too short)
  - Mock mode (`MOCK_TWILIO=true`): returns `{ mock: true }` for any valid phone
  - Real mode: returns 404 when phone not in guest list
  - Real mode: returns `{}` when phone found and OTP sent

- [ ] **`POST /api/auth/verify-otp`**
  - Returns 400 for missing phone or code
  - Mock mode (`MOCK_TWILIO=true`): returns 200 + sets session cookie for any 6-digit code
  - Mock mode: session cookie is `httpOnly`
  - Real mode: returns 400 for incorrect OTP

- [ ] **`POST /api/rsvp/submit`**
  - Returns 401 with no session cookie
  - Returns 401 with invalid/expired JWT
  - Returns 400 for missing `status` field
  - Returns 400 for invalid `status` value (not `attending`/`declined`)
  - Mock mode: returns `{ success: true }` with valid session + valid body

### Integration / E2E Tests (mock mode)

- [ ] Full happy path: phone entry → OTP → session cookie → RSVP submit → success
- [ ] Middleware: `/welcome` redirects to `/verify` with no cookie
- [ ] Middleware: `/welcome` allows through with valid JWT cookie
- [ ] RSVP form: previously submitted RSVP pre-fills form fields
