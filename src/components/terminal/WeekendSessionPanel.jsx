import { WEEKEND_SIGNAL, WEEKEND_MARKETS_URL, BLOCKWORKS_HOME } from '../../data/blockworks';

/**
 * WeekendSessionPanel — Pro Terminal Macro surface.
 *
 * Self-contained weekend-markets preview. Uses our own tiny inline SVG
 * sparklines (no chart lib, no external fetch, no iframe, zero ToS
 * surface area) and clear "illustrative sample" labeling. The big CTA
 * at the bottom link-outs to the real weekendmarkets.xyz surface on
 * Blockworks where users get live data.
 *
 * Design rule: never misrepresent this as live data. Every tile reads
 * "illustrative · last session" on hover, and the panel header declares
 * the sample status upfront.
 */

function SvgSparkline({ points, color, width = 110, height = 32 }) {
  if (!points?.length) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const coords = points
    .map((p, i) => `${(i * step).toFixed(1)},${(height - ((p - min) / range) * height).toFixed(1)}`)
    .join(' ');
  const last = points[points.length - 1];
  const lastY = height - ((last - min) / range) * height;
  return (
    <svg width={width} height={height} className="block" aria-hidden>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={coords}
        opacity="0.9"
      />
      <circle cx={width} cy={lastY} r="2.2" fill={color} />
    </svg>
  );
}

export default function WeekendSessionPanel() {
  return (
    <section className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className="text-[.56rem] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{
              color: '#FFCA3A',
              background: 'rgba(255,202,58,.1)',
              border: '1px solid rgba(255,202,58,.28)',
            }}
          >
            BLOCKWORKS · PRO
          </span>
          <h2 className="font-headline text-[.94rem] font-black text-txt flex items-center gap-2">
            🌙 Weekend Session
          </h2>
          <span className="text-[.56rem] font-mono uppercase tracking-wider text-txt-2 hidden sm:inline">
            {WEEKEND_SIGNAL.asOf} · illustrative sample
          </span>
        </div>
        <a
          href={BLOCKWORKS_HOME}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[.6rem] font-mono uppercase tracking-wider text-txt-2 hover:text-[#FFCA3A] transition-colors no-underline"
        >
          via Blockworks ↗
        </a>
      </div>

      {/* Lede */}
      <div className="text-[.78rem] text-txt-2 leading-relaxed mb-4 max-w-2xl">
        Price discovery across U.S. commodity and equity-linked risk while most
        traditional desks are closed. A cross-check signal against crypto&apos;s
        always-on tape before the Monday open — descriptive coverage, not
        trade guidance.
      </div>

      {/* Tiles grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4">
        {WEEKEND_SIGNAL.tiles.map((t) => (
          <div
            key={t.symbol}
            className="rounded-xl border p-3 flex flex-col gap-1"
            style={{
              background: 'var(--color-card)',
              borderColor: `${t.accent}22`,
            }}
            title={`${t.label} · illustrative last-session move · open weekendmarkets.xyz for live data`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono font-bold text-[.82rem] text-txt">{t.symbol}</span>
                <span className="text-[.56rem] font-mono uppercase tracking-wider text-txt-2 truncate">
                  {t.label}
                </span>
              </div>
            </div>
            <div
              className="font-mono font-bold text-[1.05rem] leading-tight"
              style={{ color: t.accent }}
            >
              {t.move}
            </div>
            <div className="-ml-1">
              <SvgSparkline points={t.spark} color={t.accent} />
            </div>
            <div className="text-[.52rem] font-mono uppercase tracking-widest text-txt-2">
              sample · last session
            </div>
          </div>
        ))}
      </div>

      {/* Big CTA — demo-safe link-out to real product */}
      <div
        className="rounded-xl border p-4 flex items-center justify-between gap-3 flex-wrap"
        style={{
          background:
            'linear-gradient(90deg, rgba(255,202,58,.08), rgba(196,108,255,.04))',
          borderColor: 'rgba(255,202,58,.28)',
        }}
      >
        <div className="flex-1 min-w-[220px]">
          <div className="font-body font-bold text-[.86rem] text-txt mb-0.5">
            Open the live surface on Blockworks
          </div>
          <div className="text-[.7rem] text-txt-2 leading-relaxed">
            Full weekend-session table — hit rate, coverage, realized vs. normal vol,
            and notional volume by asset — rendered live on weekendmarkets.xyz.
          </div>
        </div>
        <a
          href={WEEKEND_MARKETS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[.78rem] font-bold px-4 py-2 rounded-lg border transition-all cursor-pointer no-underline flex-shrink-0"
          style={{
            color: '#FFCA3A',
            background: 'rgba(255,202,58,.12)',
            borderColor: 'rgba(255,202,58,.35)',
          }}
        >
          Open weekendmarkets.xyz →
        </a>
      </div>
    </section>
  );
}
