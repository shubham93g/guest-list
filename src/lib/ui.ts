// Shared Tailwind class strings for the frosted-glass form design language.
// Edit here to restyle all login and invite form elements at once.
export const ui = {
  // Outer centering wrapper used by all form pages
  formWrapper: 'w-full max-w-sm mx-auto px-6',

  // Frosted glass card — wraps interactive inputs and buttons only
  formCard: 'bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl p-6 overflow-hidden',

  // Visual treatment for text inputs — add sizing (h-*, px-*, w-*, text-size) per component
  inputBase: 'bg-white/90 border border-white/50 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-white/40 disabled:opacity-50',

  // Full-width primary action button
  primaryButton: 'h-12 w-full bg-white text-stone-800 text-sm tracking-wide font-medium rounded-xl border border-white/60 hover:bg-stone-50 active:bg-stone-100 disabled:opacity-50 transition-colors',

  // Inline error below a form
  errorText: 'text-sm text-rose-300 text-center',

  // Secondary navigation link (Back, Use a different number)
  secondaryLink: 'text-white/60 hover:text-white/90 hover:underline underline-offset-4 transition-colors',

  // RSVP attending/declined toggle states
  toggleSelected: 'bg-white text-stone-800 border-white shadow-sm',
  toggleUnselected: 'bg-white/15 text-white/70 border-white/30 hover:bg-white/25 hover:border-white/45',
} as const;
