import useStore from '../../store/useStore';

const LP_ARMY_LINKS = [
  { label: 'Academy', url: 'https://www.lparmy.com/academy', icon: '📚', desc: '3-level curriculum from basics to advanced strategies' },
  { label: 'Discord', url: 'https://discord.gg/lparmy', icon: '💬', desc: '22K+ members sharing strategies and pool analysis' },
  { label: 'Twitter/X', url: 'https://x.com/LPArmy_', icon: '🐦', desc: 'Latest pool opportunities and market commentary' },
];

const LP_TOOLS = [
  { label: 'MetEngine', url: 'https://metengine.io', desc: 'Real-time Meteora pool analytics' },
  { label: 'UltraLP', url: 'https://ultralp.io', desc: 'Advanced position management' },
  { label: 'Cleopetra', url: 'https://cleopetra.io', desc: 'Portfolio-level LP tracking' },
  { label: 'Decoder Farmer', url: 'https://decoderfarmer.com', desc: 'Strategy optimization tools' },
];

function addUtm(url) {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}utm_source=limerscapital&utm_medium=academy&utm_campaign=lp_education`;
}

export default function LPArmyPartnership({ context = 'default' }) {
  const { markLPArmyVisited, visitedLPArmy } = useStore();

  const handleClick = () => {
    markLPArmyVisited();
  };

  return (
    <div className="rounded-xl border border-border p-6 mt-7" style={{ background: 'var(--color-card)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="text-2xl">⚔️</div>
        <div>
          <h3 className="font-body font-bold text-[.95rem] text-txt">LP Army Community</h3>
          <p className="text-[.72rem] text-txt-2">
            Continue your LP education with 22,000+ liquidity providers
          </p>
        </div>
        {visitedLPArmy && (
          <span className="ml-auto text-[.62rem] px-2 py-0.5 rounded-full bg-up/10 text-up">✓ Visited</span>
        )}
      </div>

      {/* Community Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {LP_ARMY_LINKS.map(link => (
          <a key={link.label} href={addUtm(link.url)} target="_blank" rel="noopener noreferrer"
            onClick={handleClick}
            className="flex items-start gap-2.5 rounded-lg bg-black/20 border border-border p-3.5 hover:border-sea/30 transition-all group">
            <span className="text-lg mt-0.5">{link.icon}</span>
            <div>
              <div className="font-body font-bold text-[.78rem] text-txt group-hover:text-sea transition-colors">{link.label}</div>
              <div className="text-[.65rem] text-muted leading-relaxed">{link.desc}</div>
            </div>
          </a>
        ))}
      </div>

      {/* Tools Directory */}
      <details className="group">
        <summary className="text-[.72rem] font-mono text-sea cursor-pointer hover:text-sea/80 transition-colors list-none flex items-center gap-1">
          <span className="group-open:rotate-90 transition-transform">▶</span>
          LP Tool Directory ({LP_TOOLS.length} tools)
        </summary>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
          {LP_TOOLS.map(tool => (
            <a key={tool.label} href={addUtm(tool.url)} target="_blank" rel="noopener noreferrer"
              onClick={handleClick}
              className="rounded-lg bg-black/15 border border-border px-3 py-2.5 hover:border-sea/20 transition-all">
              <div className="font-mono font-bold text-[.72rem] text-txt">{tool.label}</div>
              <div className="text-[.58rem] text-muted">{tool.desc}</div>
            </a>
          ))}
        </div>
      </details>

      {!visitedLPArmy && (
        <div className="mt-3 text-[.62rem] text-sea">
          💡 Visit LP Army to earn 40 XP + 15 LP and unlock the LP Army Recruit badge
        </div>
      )}
    </div>
  );
}
