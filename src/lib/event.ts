import type { EventDetails } from '@/types';

// Event details are static configuration, not stored in Google Sheets.
// Configure via env vars — see .env.example for the full list.
export function getEventDetails(): EventDetails {
  return {
    coupleNames: process.env.NEXT_PUBLIC_COUPLE_NAMES ?? '',
    weddingDate: process.env.NEXT_PUBLIC_WEDDING_DATE ?? '',
    weddingDay: process.env.WEDDING_DAY ?? '',
    venueName: process.env.VENUE_NAME ?? '',
    venueCity: process.env.VENUE_CITY ?? '',
  };
}
