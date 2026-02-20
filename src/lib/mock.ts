import type { Guest, EventDetails } from '@/types';

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

// Configure via MOCK_EVENT_* vars in .env.local.
export const MOCK_EVENT: EventDetails = {
  weddingDate: process.env.MOCK_EVENT_DATE ?? 'Date TBC',
  weddingDay: process.env.MOCK_EVENT_DAY ?? '',
  venueName: process.env.MOCK_EVENT_VENUE_NAME ?? 'Venue TBC',
  venueCity: process.env.MOCK_EVENT_VENUE_CITY ?? '',
  coupleNames: process.env.MOCK_EVENT_COUPLE_NAMES ?? 'Partner A & Partner B',
};

// The OTP accepted in mock mode — shown as a hint in the UI.
export const MOCK_OTP = '000000';
