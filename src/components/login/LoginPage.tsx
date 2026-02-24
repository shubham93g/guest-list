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

const RSVP_CHANNEL_COPY = {
  phone: {
    sendInstruction: 'Enter your phone number to access your invitation.',
    sendLabel: 'Proceed',
  },
  email: {
    sendInstruction: 'Enter your email address to access your invitation.',
    sendLabel: 'Proceed',
  },
} as const;

const OTP_CHANNEL_TITLE = {
  sms: 'Check your messages',
  whatsapp: 'Check WhatsApp',
  email: 'Check your email',
  skip: 'Check your messages',
} as const;

export default function LoginPage({ rsvpChannel, otpChannel }: Props) {
  const [step, setStep] = useState<Step>('identifier');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const channelCopy = RSVP_CHANNEL_COPY[rsvpChannel];
  const otpTitle = OTP_CHANNEL_TITLE[otpChannel];

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
          sendInstruction={channelCopy.sendInstruction}
          sendLabel={channelCopy.sendLabel}
        />
      ) : (
        <OTPForm
          phone={phone}
          email={email}
          onBack={() => setStep('identifier')}
          otpTitle={otpTitle}
        />
      )}
    </main>
  );
}
