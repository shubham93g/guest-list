import type { Metadata } from 'next';
import { brideCoupleName, receptionEvent } from '@/config/wedding';
import NavMenu from '@/components/landing/NavMenu';
import ScrollBackground from '@/components/landing/ScrollBackground';
import HeroSection from '@/components/landing/HeroSection';
import EventSection from '@/components/landing/EventSection';
import RSVPSection from '@/components/landing/RSVPSection';
import FAQSection from '@/components/landing/FAQSection';

export const metadata: Metadata = {
  title: `${brideCoupleName}`,
  description: 'You are invited',
};

export default function HomePage() {
  return (
    <main>
      <ScrollBackground />
      <NavMenu />
      <HeroSection />
      <EventSection event={receptionEvent} coupleNames={brideCoupleName} sectionLabel="Venue & Date" />
      <RSVPSection />
      <FAQSection />
    </main>
  );
}
