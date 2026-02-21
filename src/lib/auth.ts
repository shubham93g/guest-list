import twilio from 'twilio';

export { signJWT, verifyJWT } from './jwt';

const MOCK_TWILIO = process.env.MOCK_TWILIO === 'true';

// Switch between 'sms' and 'whatsapp' via TWILIO_VERIFY_CHANNEL in .env.local.
// Defaults to 'sms' — no WhatsApp Business Account setup required.
const TWILIO_CHANNEL = (process.env.TWILIO_VERIFY_CHANNEL ?? 'sms') as 'sms' | 'whatsapp';

function getTwilioClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );
}

export async function sendOTP(phone: string): Promise<{ mock: boolean }> {
  if (MOCK_TWILIO) {
    return { mock: true };
  }
  const client = getTwilioClient();
  await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verifications.create({ to: phone, channel: TWILIO_CHANNEL });
  return { mock: false };
}

export async function verifyOTP(phone: string, code: string): Promise<boolean> {
  if (MOCK_TWILIO) {
    return true;
  }
  const client = getTwilioClient();
  const check = await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verificationChecks.create({ to: phone, code });
  return check.status === 'approved';
}
