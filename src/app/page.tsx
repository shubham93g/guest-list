import type { Metadata } from 'next';
import { brideCoupleName, indianEvent, receptionEvent } from '@/config/wedding';
import NavMenu from '@/components/landing/NavMenu';
import ScrollBackground from '@/components/landing/ScrollBackground';
import HeroSection from '@/components/landing/HeroSection';
import EventSection from '@/components/landing/EventSection';
import RSVPSection from '@/components/landing/RSVPSection';
import FAQSection from '@/components/landing/FAQSection';
import { heroVariants } from '@/config/heroVariants';

export const metadata: Metadata = {
  title: `${brideCoupleName}`,
  description: 'You are invited',
};

export default function HomePage() {
  return (
    <main>
      <ScrollBackground />
      <NavMenu />
      <HeroSection content={heroVariants.default}/>
      <EventSection event={indianEvent} coupleNames={brideCoupleName} sectionLabel="Venue & Date" />
      <EventSection event={receptionEvent} coupleNames={brideCoupleName}/>
      <RSVPSection />
      <FAQSection />
    </main>
  );
}
