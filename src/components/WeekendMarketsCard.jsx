import useStore from '../store/useStore';
import {
  WEEKEND_MARKETS_URL,
  WEEKEND_TEASER_POINTS,
  BLOCKWORKS_HOME,
} from '../data/blockworks';

/**
 * WeekendMarketsCard — Dashboard widget surfacing Blockworks' Weekend
 * Markets price-discovery product as a tiered signal:
 *
 *   free tier → two sample data points + a clear "Unlock full surface"
 *               upsell pointing at a Pro gate (creates the tasteful
 *               tiering pull)
 *   pro tier  → same visual rhythm but with a richer "Open full chart"
 *               CTA that link-outs to weekendmarkets.xyz. When we clear
 *               ToS with Blockworks, we swap the link-out for an iframe.
 *
 * Both tiers carry Blockworks attribution. Never renders performance
 * claims — only market-movement descriptors. Matches the flagship's
 * "show, don't tell" product rule.
 */

export default function WeekendMarketsCard() {
  const userTier = useStore((s) => s.userTier);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const isPro = userTier === 'pro';

  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        background:
          'linear-gradient(135deg, rgba(255,202,58,.05), rgba(196,108,255,.04))',
        borderColor: 'rgba(255,202,58,.22)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-base">🌙</span>
          <div className="text-[.66rem] font-mono font-bold uppercase tracking-widest text-[#FFCA3A]">
            Weekend Session
          </div>
        </div>
        <a
          href={BLOCKWORKS_HOME}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[.56rem] font-mono uppercase tracking-widest text-txt-2 hover:text-[#C46CFF] transition-colors no-underline"
          title="Curated by Blockworks"
        >
          via Blockworks ↗
        </a>
      </div>

      {/* Lead line */}
      <div className="text-[.8rem] text-txt font-body font-semibold mb-1 leading-tight">
        {isPro
          ? 'Weekend futures + equity-linked risk across the board.'
          : 'US weekend futures are moving while crypto trades.'}
      </div>
      <div className="text-[.68rem] text-txt-2 leading-relaxed mb-4">
        Price discovery on weekend-open sessions — cross-check before Monday&apos;s
        open. Descriptive market coverage, not trade guidance.
      </div>

      {/* Teaser data points (sample preview) */}
      <div className="flex gap-2 flex-wrap mb-4">
        {WEEKEND_TEASER_POINTS.map((p) => (
          <div
            key={p.label}
            className="flex-1 min-w-[130px] rounded-xl border border-border px-3 py-2.5"
            style={{ background: 'var(--color-card)' }}
            title={p.hint}
          >
            <div className="text-[.56rem] font-mono uppercase tracking-widest text-muted mb-0.5">
              {p.label}
            </div>
            <div className="text-[.92rem] font-mono font-bold text-txt">{p.move}</div>
            <div className="text-[.56rem] font-mono text-txt-2 mt-0.5">sample preview</div>
          </div>
        ))}
      </div>

      {/* Tiered CTA */}
      <div className="flex items-center gap-2 flex-wrap">
        {isPro ? (
          <a
            href={WEEKEND_MARKETS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[.72rem] font-bold px-4 py-1.5 rounded-lg border transition-all cursor-pointer no-underline"
            style={{
              color: '#FFCA3A',
              background: 'rgba(255,202,58,.1)',
              borderColor: 'rgba(255,202,58,.3)',
            }}
          >
            Open full chart →
          </a>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('terminal')}
              className="text-[.72rem] font-bold px-4 py-1.5 rounded-lg border transition-all cursor-pointer"
              style={{
                color: '#FFCA3A',
                background: 'rgba(255,202,58,.1)',
                borderColor: 'rgba(255,202,58,.3)',
              }}
            >
              Unlock full surface →
            </button>
            <span className="text-[.58rem] font-mono uppercase tracking-wider text-txt-2">
              Pro · Terminal access
            </span>
          </>
        )}
      </div>
    </div>
  );
}
