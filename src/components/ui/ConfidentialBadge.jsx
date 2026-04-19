/**
 * Pill that signals a value or panel was "computed confidentially" — i.e.
 * the on-chain/off-chain math ran over encrypted inputs (real Arcium MXE
 * circuit when wired; UI-layer stub today). Use it next to aggregate
 * outputs that survive Private Mode (totals, P&L, simulation results).
 *
 * Props:
 *   label     — override the default copy
 *   size      — 'sm' | 'md'
 *   className — passthrough
 */
export default function ConfidentialBadge({
  label = 'Computed confidentially · Arcium',
  size = 'sm',
  className = '',
}) {
  const padding = size === 'md' ? 'px-2.5 py-1' : 'px-2 py-0.5';
  const fontSize = size === 'md' ? 'text-[.66rem]' : 'text-[.58rem]';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${padding} ${fontSize}
        font-mono uppercase tracking-widest
        bg-[rgba(191,129,255,0.08)] border-[rgba(191,129,255,0.35)] text-purple ${className}`}
      title="Aggregate output. In a full Arcium build, this number is the result of an Arcis MXE circuit running over encrypted positions — neither the platform nor any single MPC node sees the raw inputs."
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      {label}
    </span>
  );
}
