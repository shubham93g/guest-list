'use client';

import { useState } from 'react';
import Link from 'next/link';
import PhoneForm from '@/components/login/PhoneForm';
import OTPForm from '@/components/login/OTPForm';

type Step = 'phone' | 'otp';

interface Props {
  channel: 'sms' | 'whatsapp';
}

const CHANNEL_COPY = {
  sms: {
    description: 'Enter your phone number to receive your invitation code via SMS.',
    buttonLabel: 'Send Code via SMS',
    otpHeading: 'Check your messages',
  },
  whatsapp: {
    description: 'Enter your phone number to receive your invitation code via WhatsApp.',
    buttonLabel: 'Send Code via WhatsApp',
    otpHeading: 'Check WhatsApp',
  },
} as const;

export default function LoginPage({ channel }: Props) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [mock, setMock] = useState(false);

  const copy = CHANNEL_COPY[channel];

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
        <PhoneForm
          onSuccess={handlePhoneSuccess}
          description={copy.description}
          buttonLabel={copy.buttonLabel}
        />
      ) : (
        <OTPForm
          phone={phone}
          onBack={() => setStep('phone')}
          mock={mock}
          heading={copy.otpHeading}
        />
      )}
    </main>
  );
}
