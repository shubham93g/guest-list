import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { findGuestByPhone } from '@/lib/sheets';
import { receptionEvent, brideCoupleName, indianEvent } from '@/config/wedding';
import { ui } from '@/lib/ui';
import PersonalizedHeader from '@/components/invite/PersonalizedHeader';
import EventSection from '@/components/landing/EventSection';
import RSVPForm from '@/components/invite/RSVPForm';
import FAQSection from '@/components/landing/FAQSection';

export default async function WelcomePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const rsvpData = await findGuestByPhone(session.phone);

  if (!rsvpData) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen relative">
      <div className="fixed top-0 left-0 w-full -z-10 bg-cover bg-center" style={{ backgroundImage: "url('/hero.jpg')", height: '100lvh' }} />
      <div className={`fixed top-0 left-0 w-full -z-10 ${ui.overlay}`} style={{ height: '100lvh' }} />
      <PersonalizedHeader name={rsvpData.name} />
      <EventSection event={indianEvent} coupleNames={brideCoupleName} />
      <EventSection event={receptionEvent} coupleNames={brideCoupleName} />
      <div className="w-16 h-px bg-white/20 mx-auto mb-8" />
      <RSVPForm
        existingRSVP={rsvpData.status !== 'pending' ? rsvpData : null}
      />
      <FAQSection />
    </main>
  );
}
