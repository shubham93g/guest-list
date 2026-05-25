import { brideCoupleName, groomCoupleName, receptionEvent } from '@/config/wedding';

export interface HeroContent {
  tagline: string;
  heading: string;
  subheading?: string;
}

export const heroVariants: Record<string, HeroContent> = {
  default: {
    tagline: 'The Wedding Of',
    heading: brideCoupleName,
    subheading: receptionEvent.date,
  },
  goyal: {
    tagline: 'The Goyal Family Invites You To The Wedding Of',
    heading: groomCoupleName,
    subheading: 'With Regards from Raghav Avtar Goyal, Rajeev Goyal and Ruchi Goyal',
  },
};
