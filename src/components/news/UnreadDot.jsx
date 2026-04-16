/**
 * Tiny pulse dot — rendered next to the News nav label when there's
 * a news item newer than the user's last-seen timestamp.
 */
export default function UnreadDot({ size = 6, className = '' }) {
  return (
    <span
      aria-label="Unread news"
      title="New items since your last visit"
      className={`inline-block rounded-full align-middle ${className}`}
      style={{
        width: size,
        height: size,
        background: 'var(--color-up)',
        boxShadow: '0 0 6px var(--color-up)',
        animation: 'pulse 1.8s ease-in-out infinite',
      }}
    />
  );
}
