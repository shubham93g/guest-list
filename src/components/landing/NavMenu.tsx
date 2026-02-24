'use client';

import { useState } from 'react';

const links = [
  { label: 'Home', href: '#hero' },
  { label: 'Venue & Date', href: '#venue' },
  { label: 'FAQ', href: '#faq' },
];

export default function NavMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="fixed top-4 right-4 z-50 w-10 h-10 flex items-center justify-center text-stone-700 bg-white/80 backdrop-blur-sm border border-stone-200 rounded-full shadow-sm hover:bg-stone-50 transition-colors"
      >
        {open ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="2" y1="2" x2="14" y2="14" />
            <line x1="14" y1="2" x2="2" y2="14" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="2" y1="5" x2="14" y2="5" />
            <line x1="2" y1="11" x2="14" y2="11" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-white flex flex-col items-center justify-center gap-10">
          <nav className="flex flex-col items-center gap-8">
            {links.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="text-3xl font-serif text-stone-700 hover:text-stone-900 transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
