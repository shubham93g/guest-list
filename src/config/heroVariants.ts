import { brideCoupleName, groomCoupleName, receptionEvent } from '@/config/wedding';

export interface HeroContent {
  tagline: string;
  heading: string;
  subheading: string;
}

export const heroVariants: Record<string, HeroContent> = {
  default: {
    tagline: 'The Wedding Of',
    heading: brideCoupleName,
    subheading: '4th & 5th December 2026',
  },
  goyal: {
    tagline: 'The Goyal Family Invites You To The Wedding Of',
    heading: groomCoupleName,
    subheading: `and requests the honour of your presence as they begin a new chapter together.
    
    With blessings and best wishes from
    Raghav Autar Goyal
    Late Mrs. Madhuri Goyal
    Rajeev Goyal & Ruchi Goyal
    
    4th & 5th December 2026
    `,
  },
};
