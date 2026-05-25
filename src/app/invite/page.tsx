import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { findGuestByPhone } from '@/lib/sheets';
import PersonalizedHeader from '@/components/invite/PersonalizedHeader';
import RSVPForm from '@/components/invite/RSVPForm';

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
      <div className="fixed inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: "url('/hero.jpg')" }} />
      <div className="fixed inset-0 -z-10 bg-black/50" />
      <PersonalizedHeader name={session.name} />
      <div className="w-16 h-px bg-white/20 mx-auto mb-8" />
      <RSVPForm
        existingRSVP={rsvpData.status !== 'pending' ? rsvpData : null}
      />
    </main>
  );
}
