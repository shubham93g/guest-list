import type { Metadata } from 'next';
import { heroVariants } from '@/config/heroVariants';
import NavMenu from '@/components/landing/NavMenu';
import ScrollBackground from '@/components/landing/ScrollBackground';
import HeroSection from '@/components/landing/HeroSection';
import EventSection from '@/components/landing/EventSection';
import { groomCoupleName, receptionEvent } from '@/config/wedding';
import { RECEPTION_MODE } from '@/lib/constants';
import RSVPSection from '@/components/landing/RSVPSection';
import FAQSection from '@/components/landing/FAQSection';

export const metadata: Metadata = {
  title: groomCoupleName,
  description: 'You are invited.',
};

export default function ReceptionPage() {
  return (
    <main>
      <ScrollBackground />
      <NavMenu />
      <HeroSection content={heroVariants.reception} />
      <EventSection event={receptionEvent} coupleNames={groomCoupleName} sectionLabel="Venue & Date" />
      <RSVPSection mode={RECEPTION_MODE} />
      <FAQSection mode={RECEPTION_MODE} />
    </main>
  );
}
