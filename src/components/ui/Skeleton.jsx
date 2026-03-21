/**
 * Skeleton — reusable loading placeholder components.
 * Replaces spinner Loader components with content-shaped skeletons.
 */

/** Single skeleton bar with configurable width/height */
export function Skeleton({ w = '100%', h = '14px', rounded = '6px', className = '' }) {
  return (
    <div
      className={`animate-pulse bg-white/8 ${className}`}
      style={{ width: w, height: h, borderRadius: rounded }}
      aria-hidden="true"
    />
  );
}

/** A table-style row skeleton — mimics TokenRow / protocol row */
export function SkeletonRow({ cols = 4 }) {
  const widths = ['40%', '20%', '20%', '15%'];
  return (
    <div className="flex items-center gap-2.5 py-[5px] border-b border-white/5">
      {/* Avatar circle */}
      <Skeleton w="20px" h="20px" rounded="50%" />
      {/* Content bars */}
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} w={widths[i] || '15%'} h="11px" />
      ))}
    </div>
  );
}

/** Card skeleton — mimics a news card */
export function SkeletonCard() {
  return (
    <div
      className="flex flex-col gap-2 p-3 rounded-xl border border-white/6"
      style={{ background: 'rgba(0,0,0,.15)' }}
      aria-hidden="true"
    >
      {/* Image placeholder */}
      <Skeleton w="100%" h="90px" rounded="8px" />
      {/* Source + time row */}
      <div className="flex items-center gap-2">
        <Skeleton w="60px" h="18px" rounded="4px" />
        <Skeleton w="40px" h="10px" rounded="4px" className="ml-auto" />
      </div>
      {/* Title lines */}
      <Skeleton w="100%" h="11px" />
      <Skeleton w="90%" h="11px" />
      <Skeleton w="70%" h="11px" />
    </div>
  );
}

/** Stat-box skeleton — mimics HeroStat */
export function SkeletonStat() {
  return (
    <div className="bg-sea/6 border border-border rounded-xl p-4 flex flex-col gap-2" aria-hidden="true">
      <Skeleton w="60%" h="10px" />
      <Skeleton w="50%" h="28px" rounded="6px" />
      <Skeleton w="40%" h="10px" />
    </div>
  );
}

/** Inline rows skeleton — renders N SkeletonRows */
export function SkeletonRows({ count = 5, cols = 4 }) {
  return (
    <div aria-busy="true" aria-label="Loading data…">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </div>
  );
}
