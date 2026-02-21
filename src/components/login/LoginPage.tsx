'use client';

import { useState } from 'react';
import Link from 'next/link';
import IdentifierForm from '@/components/login/IdentifierForm';
import OTPForm from '@/components/login/OTPForm';

type Step = 'identifier' | 'otp';

interface Props {
  channel: 'sms' | 'whatsapp' | 'email';
}

const AUTH_CHANNEL_COPY = {
  sms: {
    sendInstruction: 'Enter your phone number to access your invitation.',
    sendLabel: 'Proceed',
    otpTitle: 'Check your messages',
  },
  whatsapp: {
    sendInstruction: 'Enter your phone number to access your invitation.',
    sendLabel: 'Proceed',
    otpTitle: 'Check WhatsApp',
  },
  email: {
    sendInstruction: 'Enter your email address to access your invitation.',
    sendLabel: 'Proceed',
    otpTitle: 'Check your email',
  },
} as const;

export default function LoginPage({ channel }: Props) {
  const [step, setStep] = useState<Step>('identifier');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const channelCopy = AUTH_CHANNEL_COPY[channel];

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
          channel={channel}
          onSuccess={handleIdentifierSuccess}
          sendInstruction={channelCopy.sendInstruction}
          sendLabel={channelCopy.sendLabel}
        />
      ) : (
        <OTPForm
          phone={phone}
          email={email}
          onBack={() => setStep('identifier')}
          otpTitle={channelCopy.otpTitle}
        />
      )}
    </main>
  );
}
