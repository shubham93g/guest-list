import { wedding } from '@/config/wedding';

export interface HeroContent {
  tagline: string;
  heading: string;
  subheading?: string;
}

export const heroVariants: Record<string, HeroContent> = {
  default: {
    tagline: 'The Wedding Of',
    heading: wedding.coupleNames,
    subheading: wedding.date,
  },
  goyal: {
    tagline: 'The Goyal Family Invites You To The Wedding Of',
    heading: 'Shubham & Khaing Zin',
    subheading: 'With Regards from Raghav Avtar Goyal, Rajeev Goyal and Ruchi Goyal',
  },
};
