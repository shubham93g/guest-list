import twilio from 'twilio';
import nodemailer from 'nodemailer';

export { signJWT, verifyJWT } from './jwt';

const MOCK_OTP = process.env.MOCK_OTP === 'true';

// OTP_CHANNEL determines the delivery mechanism.
// 'sms' / 'whatsapp' → Twilio Verify; 'email' → Nodemailer + Gmail.
// Exported so the login page can derive UI copy from the same value.
function isValidChannel(c: string): c is 'sms' | 'whatsapp' | 'email' {
  return c === 'sms' || c === 'whatsapp' || c === 'email';
}
const rawChannel = process.env.OTP_CHANNEL ?? 'sms';
if (!isValidChannel(rawChannel)) {
  throw new Error(`Invalid OTP_CHANNEL: "${rawChannel}". Must be one of: sms, whatsapp, email.`);
}
export const OTP_CHANNEL = rawChannel;

// In-memory store for email OTPs only (single-use, 10-minute TTL).
// Emails are expected to be pre-normalised (lowercase) by the caller.
interface EmailOTPEntry {
  code: string;
  expiresAt: number;
}
const emailOTPStore = new Map<string, EmailOTPEntry>();

const EMAIL_OTP_TTL_MS = 10 * 60 * 1_000; // 10 minutes

function generateEmailOTP(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

function getTwilioClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );
}

function getEmailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_APP_PASSWORD!,
    },
  });
}

export async function sendOTP(identifier: string): Promise<{ mock: boolean }> {
  if (MOCK_OTP) {
    return { mock: true };
  }

  if (OTP_CHANNEL === 'email') {
    const code = generateEmailOTP();
    emailOTPStore.set(identifier, { code, expiresAt: Date.now() + EMAIL_OTP_TTL_MS });
    const transporter = getEmailTransporter();
    await transporter.sendMail({
      from: process.env.GMAIL_USER!,
      to: identifier,
      subject: 'Your invitation code',
      text: `Your 6-digit code is: ${code}\n\nThis code expires in 10 minutes.`,
    });
    return { mock: false };
  }

  // sms / whatsapp → Twilio Verify
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
    emailOTPStore.delete(identifier); // single-use
    return true;
  }

  // sms / whatsapp → Twilio Verify
  const client = getTwilioClient();
  const check = await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verificationChecks.create({ to: identifier, code });
  return check.status === 'approved';
}
