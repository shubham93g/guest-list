'use client';

import { useState } from 'react';
import Link from 'next/link';
import IdentifierForm from '@/components/login/IdentifierForm';
import OTPForm from '@/components/login/OTPForm';

type Step = 'identifier' | 'otp';

interface Props {
  rsvpChannel: 'phone' | 'email';
  otpChannel: 'sms' | 'whatsapp' | 'email' | 'skip';
}

export default function LoginPage({ rsvpChannel, otpChannel }: Props) {
  const [step, setStep] = useState<Step>('identifier');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  function handleIdentifierSuccess(submittedPhone: string, submittedEmail: string) {
    setPhone(submittedPhone);
    setEmail(submittedEmail);
    setStep('otp');
  }

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center py-12">
      <div className="fixed inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: "url('/hero_2.jpg')" }} />
      <div className="fixed inset-0 -z-10 bg-black/50" />
      <Link
        href="/"
        className="absolute top-6 left-6 text-xs text-white/60 hover:text-white/90 hover:underline underline-offset-4 transition-colors"
      >
        ← Back
      </Link>

      {step === 'identifier' ? (
        <IdentifierForm
          channel={rsvpChannel}
          onSuccess={handleIdentifierSuccess}
        />
      ) : (
        <OTPForm
          phone={phone}
          email={email}
          onBack={() => setStep('identifier')}
          otpChannel={otpChannel as 'sms' | 'whatsapp' | 'email'}
        />
      )}
    </main>
  );
}
