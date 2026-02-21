import LoginPage from '@/components/login/LoginPage';

export default function Page() {
  const channel = (process.env.TWILIO_VERIFY_CHANNEL ?? 'sms') as 'sms' | 'whatsapp';
  return <LoginPage channel={channel} />;
}
