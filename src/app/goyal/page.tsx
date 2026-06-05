import type { Metadata } from 'next';
import { heroVariants } from '@/config/heroVariants';
import NavMenu from '@/components/landing/NavMenu';
import ScrollBackground from '@/components/landing/ScrollBackground';
import HeroSection from '@/components/landing/HeroSection';
import { groomCoupleName, indianEvent, receptionEvent } from '@/config/wedding';
import RSVPSection from '@/components/landing/RSVPSection';
import FAQSection from '@/components/landing/FAQSection';

export const metadata: Metadata = {
  title: groomCoupleName,
  description: 'You are invited.',
};

export default function GoyalPage() {
  return (
    <main>
      <ScrollBackground />
      <NavMenu />
      <HeroSection content={heroVariants.goyal} />
      <EventSection event={indianEvent} coupleNames={groomCoupleName} sectionLabel="Venue & Date" />
      <EventSection event={receptionEvent} coupleNames={groomCoupleName} />
      <RSVPSection />
      <FAQSection />
    </main>
  );
}
