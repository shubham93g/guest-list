import type { Metadata } from 'next';
import { heroVariants } from '@/config/heroVariants';
import NavMenu from '@/components/landing/NavMenu';
import ScrollBackground from '@/components/landing/ScrollBackground';
import HeroSection from '@/components/landing/HeroSection';
import VenueSection from '@/components/landing/VenueSection';
import RSVPSection from '@/components/landing/RSVPSection';
import FAQSection from '@/components/landing/FAQSection';

export const metadata: Metadata = {
  title: `Save the Date — Shubham & Khaing Zin`,
  description: 'You are invited. Mark your calendar.',
};

export default function GoyalPage() {
  return (
    <main>
      <ScrollBackground />
      <NavMenu />
      <HeroSection content={heroVariants.goyal} />
      <VenueSection />
      <RSVPSection />
      <FAQSection />
    </main>
  );
}
