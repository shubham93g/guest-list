import LoginPage from '@/components/login/LoginPage';
import { TWILIO_CHANNEL } from '@/lib/auth';

export default function Page() {
  return <LoginPage channel={TWILIO_CHANNEL} />;
}
