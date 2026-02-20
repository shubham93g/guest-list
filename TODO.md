# TODO

## Code Review Fixes

### Must Fix (bugs)

- [ ] **Phone validation** — `src/app/api/auth/send-otp/route.ts`
  Replace `min(8)` with E.164 regex: `/^\+[1-9]\d{7,14}$/`

- [ ] **JWT payload type safety** — `src/lib/jwt.ts:22`
  Replace `as unknown as SessionPayload` double-cast with a proper type guard
  that checks `typeof payload.phone === 'string'` and `typeof payload.name === 'string'`

### Should Fix (before real guests)

- [ ] **Rate limiting on `send-otp`** — `src/app/api/auth/send-otp/route.ts`
  Prevent endpoint spam that burns Twilio credits. Options: Vercel rate limiting,
  or a simple IP-based check middleware.

- [ ] **Typo: `Unauthorised` → `Unauthorized`** — `src/app/api/rsvp/submit/route.ts:18`

### Cleanup (nitpicks)

- [ ] **RSVP status constants** — `src/components/welcome/RSVPForm.tsx`
  Replace hardcoded `'attending'`/`'declined'` strings:
  `const RSVP_OPTIONS = ['attending', 'declined'] as const satisfies RSVPStatus[];`

- [ ] **Consistent nullish handling in `sheets.ts`** — `src/lib/sheets.ts:44–54`
  `rsvpSubmittedAt` uses `|| null`, rest uses `?? ''`. Pick one.

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

- [ ] **`src/lib/mock.ts`**
  - `MOCK_SHEETS` is true when env var is `'true'`
  - `MOCK_TWILIO` is true when env var is `'true'`
  - `MOCK_SHEETS_GUEST.name` falls back to `'Guest Name'` when `MOCK_SHEETS_GUEST_NAME` is unset

- [ ] **`src/lib/sheets.ts`** (mock mode only — no real Sheets calls in unit tests)
  - `findGuestByPhone` returns `MOCK_SHEETS_GUEST` with the given phone when `MOCK_SHEETS=true`
  - `updateGuestRSVP` logs to console (no throw) when `MOCK_SHEETS=true`

- [ ] **`src/lib/event.ts`**
  - `getEventDetails` returns values from env vars
  - `getEventDetails` returns empty strings when env vars are unset

### API Route Tests

- [ ] **`POST /api/auth/send-otp`**
  - Returns 400 for missing phone
  - Returns 400 for invalid phone format (no `+`, too short)
  - Mock mode: returns `{ sent: true }` for any valid phone
  - Real mode: returns 404 when phone not in guest list
  - Real mode: returns `{ sent: true }` when phone found

- [ ] **`POST /api/auth/verify-otp`**
  - Returns 400 for missing phone or code
  - Mock mode: returns 400 for wrong OTP
  - Mock mode: returns 200 + sets session cookie for correct OTP (`000000`)
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
