import { ui } from '@/lib/ui';

const faqs = [
  {
    q: 'What time should I arrive?',
    a: `5th December 2026 - Fullerton Hotel 
    11:00 to 12:00 Registration and Cocktail Reception
    12:00 to 15:00 Lunch
    
    Please be seated by 11:50am`,
  },
  {
    q: 'What is the dress code?',
    a: `We'd love for guests to dress in smart formal attire.
    We also warmly welcome guests who would like to honour our heritage by wearing traditional Indian or Burmese dress. 
    
    If you'd like tips, just ask!`,
  },
  {
    q: 'Can I bring a plus one ?',
    a : `We're happy to accommodate plus one, just let us know when you RSVP!`,
  },
  {
    q: 'Is there parking available?',
    a: `5th December - Fullerton Hotel
    Parking is available at The Fullerton Hotel. 
    Please indicate in the RSVP form if you need a parking coupon.
    
    For easy access to The Fullerton Hotel Singapore, please use the car park facilities at One Fullerton located at 1 Fullerton Road. The Hotel is accessible from the car park via a vehicular tunnel and an air-conditioned walkway (5-10min walk).
    
    4th December - Plume
    Parking is available at the public carpark associated with Singapore Flyer. We are unable to provide parking coupons for the 4th of December.`,
  },
  {
    q: 'How to get to The Fullerton Ballroom ?',
    a: 'The Ballroom at The Fullerton Hotel Singapore is located on the Basement Level, accessible via the main hotel lifts or the grand staircase from the lobby. You will find the registration and cocktail reception area on Basement Level. From there, the ballroom is a short flight of stairs down. A lift is also available at the end of the reception area for guests who need it. \r\n\r\nIf you have any accessibility needs, feel free to let us know!',
  },
  {
    q: 'I am travelling from overseas. Where should I stay?',
    a: 'Please indicate in the RSVP form if you would like us to help you with accomodation. We will reach out to you later',
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-lg mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-white mb-10 text-center">
          FAQ
        </p>

        <div className={ui.glassCard}>
          {faqs.map(({ q, a }) => (
            <details key={q} className="group border-b border-white/10 last:border-b-0">
              <summary className="list-none [&::-webkit-details-marker]:hidden flex items-center justify-between px-6 py-4 cursor-pointer select-none gap-4 hover:bg-white/5 transition-colors">
                <span className="text-sm font-medium text-white">{q}</span>
                <span className="flex-shrink-0 flex items-center text-white">
                  <span className="group-open:hidden text-lg leading-none">+</span>
                  <span className="hidden group-open:flex text-lg leading-none">−</span>
                </span>
              </summary>
              <div className="border-t border-white/10 px-6 py-4">
                <p className="text-sm text-white leading-relaxed whitespace-pre-line">{a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
