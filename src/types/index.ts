export type RSVPStatus = 'attending_both' | 'attending_5th' | 'declined' | 'pending';

export type ISOTimestamp = string & { readonly _brand: 'ISOTimestamp' };

export interface SessionPayload {
  name: string;
  phone: string;
}

export interface RSVPData {
  email: string;
  status: RSVPStatus;
  guestCount: number;
  plusOneNames: string;
  requiresParking: boolean;
  requiresAccommodation: boolean;
  dietaryNotes: string;
  message: string;
}

export interface Guest extends RSVPData {
  name: string;
  phone: string;
  rsvpSubmittedAt: ISOTimestamp | null;
}

export interface WeddingEvent {
  title: string;
  date: string;
  day: string;
  time: string;
  venueName: string;
  venueCity: string;
  venueAddress: string;
  venueMapUrl: string;
  datetimeISO: string;
  durationHours: number;
}
