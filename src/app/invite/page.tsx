import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { findGuestByPhone } from '@/lib/sheets';
import { receptionEvent, brideCoupleName, indianEvent } from '@/config/wedding';
import { ui } from '@/lib/ui';
import PersonalizedHeader from '@/components/invite/PersonalizedHeader';
import EventSection from '@/components/landing/EventSection';
import RSVPForm from '@/components/invite/RSVPForm';
import FAQSection from '@/components/landing/FAQSection';

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const rsvpData = await findGuestByPhone(session.phone);

  if (!rsvpData) {
    redirect('/login');
  }

  const { mode } = await searchParams;
  const isReceptionOnly = mode === 'reception' && rsvpData.status !== 'attending_both';

  return (
    <main className="min-h-screen relative">
      <div className="fixed top-0 left-0 w-full -z-10 bg-cover bg-center" style={{ backgroundImage: "url('/hero.jpg')", height: '100lvh' }} />
      <div className={`fixed top-0 left-0 w-full -z-10 ${ui.overlay}`} style={{ height: '100lvh' }} />
      <PersonalizedHeader name={rsvpData.name} />
      {!isReceptionOnly && (
        <EventSection event={indianEvent} coupleNames={brideCoupleName} sectionLabel="Venue & Date" />
      )}
      <EventSection event={receptionEvent} coupleNames={brideCoupleName} sectionLabel={isReceptionOnly ? 'Venue & Date' : undefined} />
      <div className="w-16 h-px bg-white/20 mx-auto mb-8" />
      <RSVPForm
        guestName={rsvpData.name}
        existingRSVP={rsvpData.status !== 'pending' ? rsvpData : null}
        mode={isReceptionOnly ? 'reception' : undefined}
      />
      <FAQSection mode={isReceptionOnly ? 'reception' : undefined} />
    </main>
  );
}
