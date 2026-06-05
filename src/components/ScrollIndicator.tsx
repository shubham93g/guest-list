interface Props {
  className?: string;
}

export default function ScrollIndicator({ className = "absolute bottom-10 left-0 right-0 flex justify-center animate-bounce text-white/50" }: Props) {
  return (
    <div className={className}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}
