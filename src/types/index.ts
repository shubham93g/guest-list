export type RSVPStatus = 'attending' | 'declined' | 'pending';

export type ISOTimestamp = string & { readonly _brand: 'ISOTimestamp' };

export interface EventDetails {
  weddingDate: string;
  weddingDay: string;
  venueName: string;
  venueCity: string;
  coupleNames: string;
}

export interface SessionPayload {
  name: string;
  phone: string;
  email?: string;
}

export interface RSVPData {
  status: RSVPStatus;
  dietaryNotes: string;
  plusOneAttending: boolean;
  plusOneName: string;
  notes: string;
}

export interface Guest extends RSVPData {
  name: string;
  phone: string;
  email: string;
  rsvpSubmittedAt: ISOTimestamp | null;
}
