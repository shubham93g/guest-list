'use client';

import { useState } from 'react';
import Link from 'next/link';
import IdentifierForm from '@/components/login/IdentifierForm';
import OTPForm from '@/components/login/OTPForm';
import { ui } from '@/lib/ui';

type Step = 'identifier' | 'otp';

interface Props {
  otpChannel: 'sms' | 'whatsapp' | 'skip';
}

export default function LoginPage({ otpChannel }: Props) {
  const [step, setStep] = useState<Step>('identifier');
  const [phone, setPhone] = useState('');

  function handleIdentifierSuccess(submittedPhone: string) {
    setPhone(submittedPhone);
    setStep('otp');
  }

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center py-12">
      <div className="fixed inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: "url('/hero_2.jpg')" }} />
      <div className="fixed inset-0 -z-10 bg-black/50" />
      <Link
        href="/"
        className={`absolute top-6 left-6 text-xs ${ui.secondaryLink}`}
      >
        ← Back
      </Link>

      {step === 'identifier' ? (
        <IdentifierForm
          onSuccess={handleIdentifierSuccess}
        />
      ) : (
        <OTPForm
          phone={phone}
          onBack={() => setStep('identifier')}
          otpChannel={otpChannel as 'sms' | 'whatsapp'}
        />
      )}
    </main>
  );
}
