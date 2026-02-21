# TODO

## Pending Changes

- [ ] Rename `OTP_CHANNEL` → `AUTH_CHANNEL` (next PR after `feat/skip-otp-mode` is merged)
- [ ] Remove all mock mode support (`MOCK_SHEETS`, `MOCK_OTP`, `MOCK_SHEETS_GUEST_NAME`, `SKIP_OTP`) in a future cleanup PR

## Tests to Write

### Unit Tests

- [ ] **`src/lib/jwt.ts`**
  - `signJWT` returns a non-empty string
  - `verifyJWT` returns correct payload for a valid token
  - `verifyJWT` returns `null` for an expired token
  - `verifyJWT` returns `null` for a tampered token
  - `verifyJWT` returns `null` for a garbage string
  - `getJWTSecret` throws if `JWT_SECRET` env var is missing

- [ ] **`src/lib/event.ts`**
  - `getEventDetails` returns values from env vars
  - `getEventDetails` returns empty strings when env vars are unset

### API Route Tests

- [ ] **`POST /api/auth/send-otp`**
  - Returns 422 for missing phone
  - Returns 422 for invalid phone format (no `+`, too short) — same response as not found to prevent enumeration
  - Returns 429 when rate limit exceeded (IP or phone)
  - Returns 422 when phone not in guest list
  - Returns 200 when phone found and OTP sent

- [ ] **`POST /api/auth/login-otp`**
  - Returns 400 for missing phone or code
  - Returns 400 for incorrect OTP
  - Returns 200 + sets `httpOnly` session cookie for correct OTP

- [ ] **`POST /api/rsvp/submit`**
  - Returns 401 with no session cookie
  - Returns 401 with invalid/expired JWT
  - Returns 400 for missing `status` field
  - Returns 400 for invalid `status` value (not `attending`/`declined`)
  - Returns 200 with valid session + valid body

### Integration / E2E Tests

- [ ] Full happy path: phone entry → OTP → session cookie → RSVP submit → success
- [ ] Middleware: `/invite` redirects to `/login` with no cookie
- [ ] Middleware: `/invite` allows through with valid JWT cookie
- [ ] Middleware: `/login` redirects to `/invite` with a valid session cookie
- [ ] Middleware: `/login` shows the form with no cookie
- [ ] RSVP form (returning guest): banner shows prior response ("Attending" / "Unable to attend")
- [ ] RSVP form (returning guest): all fields pre-filled from existing RSVP data
- [ ] RSVP form (returning guest): success screen shows "has been updated" copy
- [ ] RSVP form (new guest): no banner shown, form starts empty, success screen shows "has been received" copy
