import useStore from '../../store/useStore';

/**
 * Renders a financial value that respects the global Arcium Private Mode toggle.
 * When privateMode is on, the value is replaced with masked dots while keeping
 * roughly the same width so layout doesn't jump. When off, children render
 * normally.
 *
 * Use this around any per-position dollar/TT$/percent figure on the Portfolio
 * panel. Aggregate P&L is intentionally still rendered (that's the "computed
 * confidentially" output a real Arcis circuit would return).
 *
 * Props:
 *   children   — the formatted value to show when private mode is off
 *   width      — optional; how many mask characters to render (default 5)
 *   className  — passthrough
 */
export default function PrivateValue({ children, width = 5, className = '' }) {
  const privateMode = useStore((s) => s.privateMode);
  if (!privateMode) return <span className={className}>{children}</span>;
  return (
    <span
      className={`font-mono text-purple/80 select-none ${className}`}
      aria-label="Hidden by Private Mode"
      title="Hidden by Private Mode (Arcium)"
    >
      {'•'.repeat(width)}
    </span>
  );
}
