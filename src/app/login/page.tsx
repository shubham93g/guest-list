import LoginPage from '@/components/login/LoginPage';
import { OTP_CHANNEL } from '@/lib/auth';
import { RECEPTION_MODE, INVITE_MODE_PARAM } from '@/lib/constants';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const mode = params[INVITE_MODE_PARAM];
  return <LoginPage otpChannel={OTP_CHANNEL} mode={mode === RECEPTION_MODE ? RECEPTION_MODE : undefined} />;
}
