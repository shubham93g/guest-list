export type RSVPStatus = 'attending' | 'declined' | 'pending';

export interface Guest {
  name: string;
  phone: string;
  rsvpStatus: RSVPStatus;
  rsvpSubmittedAt: string | null;
  dietaryNotes: string;
  plusOneAttending: boolean;
  plusOneName: string;
  notes: string;
}

export interface EventDetails {
  weddingDate: string;
  weddingDay: string;
  venueName: string;
  venueCity: string;
  coupleNames: string;
}

export interface SessionPayload {
  phone: string;
  name: string;
}

export interface RSVPData {
  status: RSVPStatus;
  dietaryNotes: string;
  plusOneAttending: boolean;
  plusOneName: string;
  notes: string;
}
