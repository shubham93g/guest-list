'use client';

import { useState } from 'react';
import Link from 'next/link';
import PhoneForm from '@/components/login/PhoneForm';
import OTPForm from '@/components/login/OTPForm';

type Step = 'identifier' | 'otp';

interface Props {
  channel: 'sms' | 'whatsapp' | 'email';
}

const OTP_CHANNEL_COPY = {
  sms: {
    sendInstruction: 'Enter your phone number to receive your invitation code via SMS.',
    sendLabel: 'Send Code via SMS',
    otpTitle: 'Check your messages',
  },
  whatsapp: {
    sendInstruction: 'Enter your phone number to receive your invitation code via WhatsApp.',
    sendLabel: 'Send Code via WhatsApp',
    otpTitle: 'Check WhatsApp',
  },
  email: {
    sendInstruction: 'Enter your email address to receive your invitation code.',
    sendLabel: 'Send Code via Email',
    otpTitle: 'Check your inbox',
  },
} as const;

export default function LoginPage({ channel }: Props) {
  const [step, setStep] = useState<Step>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [mock, setMock] = useState(false);

  const channelCopy = OTP_CHANNEL_COPY[channel];

  function handleIdentifierSuccess(submittedIdentifier: string, isMock?: boolean) {
    setIdentifier(submittedIdentifier);
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

      {step === 'identifier' ? (
        <PhoneForm
          channel={channel}
          onSuccess={handleIdentifierSuccess}
          sendInstruction={channelCopy.sendInstruction}
          sendLabel={channelCopy.sendLabel}
        />
      ) : (
        <OTPForm
          identifier={identifier}
          channel={channel}
          onBack={() => setStep('identifier')}
          mock={mock}
          otpTitle={channelCopy.otpTitle}
        />
      )}
    </main>
  );
}
