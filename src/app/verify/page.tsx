'use client';

import { useState } from 'react';
import PhoneForm from '@/components/verify/PhoneForm';
import OTPForm from '@/components/verify/OTPForm';
import Link from 'next/link';

type Step = 'phone' | 'otp';

export default function VerifyPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [mock, setMock] = useState(false);

  function handlePhoneSuccess(submittedPhone: string, isMock?: boolean) {
    setPhone(submittedPhone);
    setMock(isMock ?? false);
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

      {step === 'phone' ? (
        <PhoneForm onSuccess={handlePhoneSuccess} />
      ) : (
        <OTPForm phone={phone} onBack={() => setStep('phone')} mock={mock} />
      )}
    </main>
  );
}
