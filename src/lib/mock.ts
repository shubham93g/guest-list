import type { Guest } from '@/types';

export const MOCK_MODE = process.env.MOCK_MODE === 'true';

// In mock mode, any phone number gets this guest profile.
// Configure via MOCK_GUEST_NAME in .env.local — never hardcode personal details here.
export const MOCK_GUEST: Guest = {
  name: process.env.MOCK_GUEST_NAME ?? 'Guest Name',
  phone: '',
  rsvpStatus: 'pending',
  rsvpSubmittedAt: null,
  dietaryNotes: '',
  plusOneAttending: false,
  plusOneName: '',
  notes: '',
};


// The OTP accepted in mock mode — shown as a hint in the UI.
// Configured via NEXT_PUBLIC_MOCK_OTP in .env.local so server and client stay in sync.
export const MOCK_OTP = process.env.NEXT_PUBLIC_MOCK_OTP ?? '000000';
