import type { Guest } from '@/types';

export const MOCK_SHEETS = process.env.MOCK_SHEETS === 'true';
export const MOCK_TWILIO = process.env.MOCK_TWILIO === 'true';

// When MOCK_SHEETS=true, any phone number gets this guest profile.
// Configure via MOCK_SHEETS_GUEST_NAME in .env.local — never hardcode personal details here.
export const MOCK_SHEETS_GUEST: Guest = {
  name: process.env.MOCK_SHEETS_GUEST_NAME ?? 'Guest Name',
  phone: '',
  rsvpStatus: 'pending',
  rsvpSubmittedAt: null,
  dietaryNotes: '',
  plusOneAttending: false,
  plusOneName: '',
  notes: '',
};
