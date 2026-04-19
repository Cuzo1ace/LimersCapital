import useStore from '../../store/useStore';

const Eye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOff = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/**
 * Header pill that toggles Arcium Private Mode for the whole Portfolio panel.
 * Reflects current state with eye/eye-off iconography and a soft purple glow
 * when active so users know the surface is currently confidential.
 */
export default function PrivateModeToggle({ compact = false, className = '' }) {
  const privateMode = useStore((s) => s.privateMode);
  const toggle = useStore((s) => s.togglePrivateMode);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={privateMode}
      title={privateMode
        ? 'Private Mode is ON — balances hidden via Arcium-style masking. Click to reveal.'
        : 'Click to enable Private Mode (Arcium-style confidential portfolio).'}
      className={`inline-flex items-center gap-1.5 rounded-lg border font-mono text-[.66rem] uppercase tracking-widest cursor-pointer transition-all
        ${compact ? 'px-2 py-1' : 'px-2.5 py-1.5'}
        ${privateMode
          ? 'bg-[rgba(191,129,255,0.12)] border-[rgba(191,129,255,0.45)] text-purple shadow-[0_0_18px_rgba(191,129,255,0.15)]'
          : 'bg-transparent border-border text-txt-2 hover:border-[rgba(191,129,255,0.4)] hover:text-purple'}
        ${className}`}
    >
      {privateMode ? <EyeOff /> : <Eye />}
      <span>{privateMode ? 'Private' : 'Public'}</span>
    </button>
  );
}
