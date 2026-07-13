import LoginPage from '@/components/login/LoginPage';
import { OTP_CHANNEL } from '@/lib/auth';

export default async function Page({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  return <LoginPage otpChannel={OTP_CHANNEL} mode={mode === 'reception' ? 'reception' : undefined} />;
}
