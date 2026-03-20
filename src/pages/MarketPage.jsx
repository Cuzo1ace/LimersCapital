import { useQuery } from '@tanstack/react-query';
import { fetchSolanaMarketData, fetchSolPrice, fetchSolanaTVL } from '../api/prices';

function fmt(n, decimals = 2) {
  if (n == null) return '—';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(decimals)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(decimals)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(decimals)}K`;
  return `$${n.toFixed(decimals)}`;
}

function ChgPill({ value }) {
  if (value == null) return <span className="text-muted text-xs">—</span>;
  const cls = value > 0 ? 'text-up bg-up/10' : value < 0 ? 'text-down bg-down/10' : 'text-muted bg-muted/10';
  return (
    <span className={`text-[.78rem] px-2 py-0.5 rounded-md inline-block ${cls}`}>
      {value > 0 ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

const CAT_CLS = {
  L1:     'text-sea border-border bg-sea/7',
  Stable: 'text-palm border-palm/30 bg-palm/7',
  RWA:    'text-sun border-sun/30 bg-sun/7',
  DeFi:   'text-sea border-border bg-sea/7',
  Meme:   'text-coral border-coral/30 bg-coral/7',
  Infra:  'text-coral border-coral/30 bg-coral/7',
  Stock:  'text-[#76B900] border-[#76B900]/30 bg-[#76B900]/7',
};

const TOKEN_META = {
  solana: { sym: 'SOL', cat: 'L1' },
  'usd-coin': { sym: 'USDC', cat: 'Stable' },
  'ondo-finance': { sym: 'ONDO', cat: 'RWA' },
  'jupiter-exchange-solana': { sym: 'JUP', cat: 'DeFi' },
  raydium: { sym: 'RAY', cat: 'DeFi' },
  bonk: { sym: 'BONK', cat: 'Meme' },
  'render-token': { sym: 'RENDER', cat: 'Infra' },
  helium: { sym: 'HNT', cat: 'Infra' },
  // Jupiter-only tokens (new CAs)
  gold:  { sym: 'GOLD',  cat: 'RWA' },
  zbtc:  { sym: 'zBTC',  cat: 'RWA' },
  weth:  { sym: 'WETH',  cat: 'L1' },
  bill:  { sym: 'BILL',  cat: 'RWA' },
  perp:  { sym: 'PERP',  cat: 'DeFi' },
  pren:  { sym: 'PREN',  cat: 'DeFi' },
  nvdax: { sym: 'NVDAX', cat: 'Stock' },
};

export default function MarketPage() {
  const solQ = useQuery({ queryKey: ['sol-price'], queryFn: fetchSolPrice, refetchInterval: 30000 });
  const marketQ = useQuery({ queryKey: ['sol-market'], queryFn: fetchSolanaMarketData, refetchInterval: 60000 });
  const tvlQ = useQuery({ queryKey: ['sol-tvl'], queryFn: fetchSolanaTVL, staleTime: 300000 });

  return (
    <div>
      {/* Hero */}
      <div className="rounded-2xl p-9 mb-7 grid grid-cols-1 md:grid-cols-2 gap-9 items-center overflow-hidden relative border border-border"
        style={{ background: 'linear-gradient(135deg, var(--color-night-2) 0%, rgba(0,200,180,.05) 100%)' }}>
        <div>
          <div className="inline-block bg-sea/12 border border-sea/30 rounded-full text-[.68rem] text-sea px-3 py-0.5 tracking-widest uppercase mb-3.5">
            Limer's Capital — Solana × RWA Markets
          </div>
          <h1 className="font-serif text-[2.6rem] font-black leading-[1.05] text-txt mb-3.5">
            The Future is<br /><em className="italic text-sea">On-Chain</em>
          </h1>
          <p className="font-mono text-txt-2 text-[.82rem] leading-relaxed">
            Trade tokenized real-world assets — bonds, funds, stablecoins — 24/7 on Solana.
            No broker, no minimum. Start paper trading today.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <StatCard label="Solana TVL" value={tvlQ.data ? fmt(tvlQ.data) : '—'} sub={tvlQ.isLoading ? 'Loading...' : null} up />
          <StatCard
            label="SOL Price"
            value={solQ.data ? fmt(solQ.data.price) : '—'}
            change={solQ.data?.change24h}
          />
          <StatCard label="RWA Tokens" value="345+" sub="Active on-chain" up />
          <StatCard label="30D Volume" value="$2.27B" sub="+43%" up />
        </div>
      </div>

      {/* DeFiLlama Solana Dashboard */}
      <div className="mb-7">
        <SectionHead title="Solana DeFi Dashboard" label="DeFiLlama · Live" />
        <div className="rounded-2xl border border-border overflow-hidden" style={{ background: 'var(--color-card)' }}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div>
              <div className="font-sans font-bold text-[.88rem] text-txt">Solana Chain Overview</div>
              <div className="text-[.65rem] text-muted">TVL, protocols, and chain metrics</div>
            </div>
            <a href="https://defillama.com/chain/solana" target="_blank" rel="noopener"
              className="text-[.65rem] text-sea no-underline hover:underline">
              defillama.com/chain/solana ↗
            </a>
          </div>
          <div className="relative w-full h-[280px] md:h-[500px]">
            <iframe
              src="https://defillama.com/chain/solana"
              loading="lazy"
              className="absolute inset-0 w-full h-full border-none"
              title="DeFiLlama Solana Dashboard"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      </div>

      {/* DeFiLlama Solana RWA Dashboard */}
      <div className="mb-7">
        <SectionHead title="Solana RWA Dashboard" label="DeFiLlama · Real-World Assets" />
        <div className="rounded-2xl border border-sea/20 overflow-hidden" style={{ background: 'var(--color-card)' }}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-sea/15">
            <div>
              <div className="font-sans font-bold text-[.88rem] text-sun">Real-World Assets on Solana</div>
              <div className="text-[.65rem] text-muted">Tokenized treasuries, bonds, and RWA protocols</div>
            </div>
            <a href="https://defillama.com/rwa/chain/solana" target="_blank" rel="noopener"
              className="text-[.65rem] text-sea no-underline hover:underline">
              defillama.com/rwa/chain/solana ↗
            </a>
          </div>
          <div className="relative w-full h-[280px] md:h-[500px]">
            <iframe
              src="https://defillama.com/rwa/chain/solana"
              loading="lazy"
              className="absolute inset-0 w-full h-full border-none"
              title="DeFiLlama Solana RWA"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      </div>

      {/* Token Table */}
      <SectionHead
        title="RWA & Solana Tokens"
        label="CoinGecko API"
        action={
          <button
            onClick={() => marketQ.refetch()}
            className={`bg-transparent border border-border text-sea cursor-pointer rounded-lg px-3 py-1 text-[.7rem] font-mono transition-all hover:bg-sea/10 ${marketQ.isFetching ? 'animate-spin' : ''}`}
          >
            ↻ Refresh
          </button>
        }
      />

      {/* Header row — 4 cols mobile / 7 cols desktop */}
      <div className="grid gap-2 md:gap-3.5 items-center px-4 py-1 text-[.68rem] text-muted uppercase tracking-widest
        [grid-template-columns:44px_2fr_1.1fr_.9fr]
        md:[grid-template-columns:44px_2fr_1.1fr_.9fr_1fr_1fr_1.1fr]">
        <span />
        <span>Token</span>
        <span>Price</span>
        <span>24h</span>
        <span className="hidden md:block">Market Cap</span>
        <span className="hidden md:block">Volume</span>
        <span className="hidden md:block">Category</span>
      </div>

      <div className="flex flex-col gap-0.5">
        {marketQ.isLoading && (
          <div className="flex flex-col items-center gap-3.5 py-12 text-muted text-sm">
            <div className="w-7 h-7 border-[3px] border-border border-t-sea rounded-full animate-spin" />
            Loading market data...
          </div>
        )}
        {marketQ.isError && (
          <div className="text-coral text-sm text-center py-9">
            Failed to load: {marketQ.error.message}. <button onClick={() => marketQ.refetch()} className="text-sea underline cursor-pointer bg-transparent border-none font-mono">Retry</button>
          </div>
        )}
        {marketQ.data?.map(token => {
          const meta = TOKEN_META[token.id] || { sym: token.symbol.toUpperCase(), cat: token._cat || '—' };
          const catCls = CAT_CLS[meta.cat] || 'text-muted border-muted/20 bg-muted/7';
          const col = token._col || '#5B7A9A';
          return (
            <div
              key={token.id}
              className="grid gap-2 md:gap-3.5 items-center rounded-xl px-3 md:px-4 py-3 border border-border cursor-pointer transition-all hover:border-sea/35 hover:translate-x-[3px]
                [grid-template-columns:44px_2fr_1.1fr_.9fr]
                md:[grid-template-columns:44px_2fr_1.1fr_.9fr_1fr_1fr_1.1fr]"
              style={{ background: 'var(--color-card)' }}
            >
              {token.image
                ? <img src={token.image} alt={meta.sym} className="w-9 h-9 rounded-full" />
                : <div className="w-9 h-9 rounded-full flex items-center justify-center text-[.65rem] font-extrabold"
                    style={{ background: col + '22', color: col }}>{meta.sym.slice(0, 3)}</div>
              }
              <div className="min-w-0">
                <div className="font-sans font-bold text-[.88rem]">{meta.sym}</div>
                <div className="text-[.68rem] text-muted truncate">{token.name}</div>
                {/* Category shown inline on mobile */}
                <span className={`md:hidden text-[.6rem] px-1.5 py-0.5 rounded-full border whitespace-nowrap ${catCls}`}>
                  {meta.cat}
                </span>
              </div>
              <div className="font-sans font-bold text-[.88rem]">{fmt(token.current_price, token.current_price < 0.01 ? 6 : 2)}</div>
              <ChgPill value={token.price_change_percentage_24h} />
              <div className="hidden md:block text-[.8rem] text-txt-2">{token.market_cap ? fmt(token.market_cap) : '—'}</div>
              <div className="hidden md:block text-[.8rem] text-txt-2">{token.total_volume ? fmt(token.total_volume) : '—'}</div>
              <span className={`hidden md:inline-block text-[.65rem] px-2 py-0.5 rounded-full border text-center whitespace-nowrap ${catCls}`}>
                {meta.cat}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, change, sub, up }) {
  return (
    <div className="bg-sea/6 border border-border rounded-xl p-4">
      <div className="text-[.68rem] text-muted uppercase tracking-widest mb-1.5">{label}</div>
      <div className="font-sans text-[1.45rem] font-extrabold text-txt">{value}</div>
      {change != null && <ChgPill value={change} />}
      {sub && <div className={`text-[.72rem] mt-1 ${up ? 'text-up' : 'text-muted'}`}>{up ? '▲ ' : ''}{sub}</div>}
    </div>
  );
}

function SectionHead({ title, label, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-sans text-[.92rem] font-bold uppercase tracking-widest text-txt">{title}</h2>
      <div className="flex gap-2 items-center">
        {label && <span className="text-[.68rem] text-muted px-2.5 py-0.5 border border-white/8 rounded-full">{label}</span>}
        {action}
      </div>
    </div>
  );
}
