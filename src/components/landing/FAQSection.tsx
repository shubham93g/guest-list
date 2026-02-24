const faqs = [
  {
    q: 'What time should I arrive?',
    a: 'We recommend arriving by [time] to find your seat before the ceremony begins at [ceremony start time].',
  },
  {
    q: 'What is the dress code?',
    a: '[Dress code — e.g. "Black tie optional" or "Smart casual"]. We want you to feel comfortable, so when in doubt, err on the side of more formal.',
  },
  {
    q: 'Can I bring a plus one?',
    a: 'Due to venue capacity, we are only able to accommodate the guests named on the invitation. Your invitation will indicate whether a plus one has been included.',
  },
  {
    q: 'Are children welcome?',
    a: '[Children policy — e.g. "We love your little ones! Children are welcome." or "We have organised an adults-only celebration. We hope you enjoy a rare night off!"]',
  },
  {
    q: 'Where should I stay?',
    a: 'We recommend [hotel name or area]. A room block has [been / not been] arranged — details will be included in the formal invitation.',
  },
  {
    q: 'Is there parking available?',
    a: '[Parking details — e.g. "Free on-site parking is available." or "Street parking is available nearby. We recommend arriving early or using a rideshare service."]',
  },
  {
    q: 'Can I post photos on social media?',
    a: '[Photo policy — e.g. "Please feel free to share your photos using the hashtag #[YourHashtag]." or "We are having an unplugged ceremony — please keep phones away during the ceremony itself, but feel free to snap away at the reception!"]',
  },
  {
    q: 'Who should I contact if I have questions?',
    a: 'Please reach out to [contact name] at [email or phone number] for any questions not answered here.',
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="py-24 px-6 bg-stone-50">
      <div className="max-w-lg mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-10 text-center">
          FAQ
        </p>

        <div className="space-y-3">
          {faqs.map(({ q, a }) => (
            <details key={q} className="group border border-stone-200 rounded-2xl bg-white overflow-hidden">
              <summary className="list-none [&::-webkit-details-marker]:hidden flex items-center justify-between px-6 py-4 cursor-pointer select-none gap-4">
                <span className="text-sm font-medium text-stone-700">{q}</span>
                <span className="flex-shrink-0 flex items-center text-stone-400">
                  <span className="group-open:hidden text-lg leading-none">+</span>
                  <span className="hidden group-open:flex text-lg leading-none">−</span>
                </span>
              </summary>
              <div className="border-t border-stone-100 px-6 py-4">
                <p className="text-sm text-stone-500 leading-relaxed">{a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
