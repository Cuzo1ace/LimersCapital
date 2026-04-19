import { CURATED_RESEARCH, BLOCKWORKS_HOME } from '../../data/blockworks';

/**
 * BlockworksResearchHub — the Pro Terminal's top-of-Research surface.
 *
 * A premium 6-card grid of curated Blockworks editorial (research,
 * podcast, prices, newsletter) with link-outs to blockworks.com. Every
 * card carries its own accent gradient, a source kicker chip, a short
 * editorial summary we author, and a clear "Read on Blockworks ↗" CTA.
 *
 * No iframes, no scraping — demo-ready while the live Research API and
 * iframe-ToS conversations sit in the pipeline. When either clears,
 * this component swaps in richer data without touching the layout.
 */
export default function BlockworksResearchHub() {
  return (
    <section className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className="text-[.56rem] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{
              color: '#C46CFF',
              background: 'rgba(196,108,255,.1)',
              border: '1px solid rgba(196,108,255,.25)',
            }}
          >
            BLOCKWORKS · PRO
          </span>
          <h2 className="font-headline text-[.94rem] font-black text-txt">
            Research Hub
          </h2>
          <span className="text-[.56rem] font-mono uppercase tracking-wider text-txt-2 hidden sm:inline">
            curated weekly for emerging-markets builders
          </span>
        </div>
        <a
          href={BLOCKWORKS_HOME}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[.6rem] font-mono uppercase tracking-wider text-txt-2 hover:text-[#C46CFF] transition-colors no-underline"
        >
          Browse all on Blockworks ↗
        </a>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {CURATED_RESEARCH.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-xl border overflow-hidden transition-all hover:-translate-y-0.5 no-underline"
            style={{
              background: 'var(--color-card)',
              borderColor: 'rgba(255,255,255,.08)',
            }}
            title={item.summary}
          >
            {/* Accent cover — a clean generative gradient per topic */}
            <div
              className="relative h-20 flex items-end justify-between px-3 py-2"
              style={{
                background: `linear-gradient(135deg, ${item.accent}33 0%, ${item.accent}11 60%, rgba(0,0,0,0.35) 100%)`,
                borderBottom: `1px solid ${item.accent}22`,
              }}
            >
              <span
                className="text-[.52rem] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                style={{
                  color: item.accent,
                  background: 'rgba(0,0,0,.35)',
                  border: `1px solid ${item.accent}40`,
                }}
              >
                {item.kicker}
              </span>
              <span className="text-[.5rem] font-mono uppercase tracking-widest text-txt-2">
                {item.dateLabel}
              </span>
            </div>

            {/* Body */}
            <div className="p-3 flex flex-col flex-1">
              <div className="text-[.82rem] font-body font-bold text-txt mb-1.5 leading-tight group-hover:text-[#C46CFF] transition-colors">
                {item.title}
              </div>
              <div className="text-[.68rem] text-txt-2 leading-relaxed flex-1">
                {item.summary}
              </div>
              <div className="mt-3 text-[.58rem] font-mono uppercase tracking-wider text-txt-2 group-hover:text-[#C46CFF] transition-colors">
                Read on Blockworks ↗
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
