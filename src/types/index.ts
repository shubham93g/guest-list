import { RSVP_STATUS } from '@/lib/constants';
export type RSVPStatus = typeof RSVP_STATUS[keyof typeof RSVP_STATUS];

export type ISOTimestamp = string & { readonly _brand: 'ISOTimestamp' };

export interface SessionPayload {
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
  countryCode: string;
  phone: string;
  rsvpSubmittedAt: ISOTimestamp | null;
}

export interface FlightData {
  arrivalFrom: string;
  arrivalDate: string;
  arrivalTime: string;
  arrivalFlightNumber: string;
  departureDate: string;
  departureTime: string;
  departureFlightNumber: string;
  message: string;
}

export interface FlightDetails extends FlightData {
  name: string;
  countryCode: string;
  phone: string;
  submittedAt: ISOTimestamp | null;
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
