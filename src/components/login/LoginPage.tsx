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
    <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center py-12">
      <Link
        href="/"
        className="absolute top-6 left-6 text-xs text-stone-400 hover:text-stone-600 transition-colors"
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
