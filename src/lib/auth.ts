import twilio from 'twilio';
import { Resend } from 'resend';

export { signJWT, verifyJWT } from './jwt';

const MOCK_OTP = process.env.MOCK_OTP === 'true';

// Switch between 'sms', 'whatsapp', and 'email' via OTP_CHANNEL in .env.local.
// Defaults to 'sms' — no WhatsApp Business Account or email setup required.
// Exported so page.tsx can derive UI copy from the same value without a second env read.
const VALID_CHANNELS = new Set<string>(['sms', 'whatsapp', 'email']);
const rawChannel = process.env.OTP_CHANNEL ?? 'sms';
if (!VALID_CHANNELS.has(rawChannel)) {
  throw new Error(`Invalid OTP_CHANNEL: "${rawChannel}". Must be one of: ${[...VALID_CHANNELS].join(', ')}.`);
}
export const OTP_CHANNEL = rawChannel as 'sms' | 'whatsapp' | 'email';

// --- Email OTP store (email channel only) ---
// Single-use, 10-minute TTL. Keys are normalised email addresses.
interface EmailOTPEntry {
  code: string;
  expiresAt: number;
}
const emailOTPStore = new Map<string, EmailOTPEntry>();
const EMAIL_OTP_TTL_MS = 10 * 60 * 1_000;

function generateEmailOTP(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

// --- Client factories (serverless-safe: created per-invocation) ---

function getTwilioClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );
}

function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY!);
}

// --- Public API ---

export async function sendOTP(identifier: string): Promise<{ mock: boolean }> {
  if (MOCK_OTP) {
    return { mock: true };
  }

  if (OTP_CHANNEL === 'email') {
    const code = generateEmailOTP();
    emailOTPStore.set(identifier, { code, expiresAt: Date.now() + EMAIL_OTP_TTL_MS });
    const resend = getResendClient();
    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: identifier,
      subject: 'Your invitation code',
      text: `Your code is: ${code}\n\nThis code expires in 10 minutes.`,
    });
    return { mock: false };
  }

  const client = getTwilioClient();
  await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verifications.create({ to: identifier, channel: OTP_CHANNEL });
  return { mock: false };
}

export async function verifyOTP(identifier: string, code: string): Promise<boolean> {
  if (MOCK_OTP) {
    return true;
  }

  if (OTP_CHANNEL === 'email') {
    const entry = emailOTPStore.get(identifier);
    if (!entry) {
      return false;
    }
    if (Date.now() > entry.expiresAt) {
      emailOTPStore.delete(identifier);
      return false;
    }
    if (entry.code !== code) {
      return false;
    }
    emailOTPStore.delete(identifier);
    return true;
  }

  const client = getTwilioClient();
  const check = await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verificationChecks.create({ to: identifier, code });
  return check.status === 'approved';
}
