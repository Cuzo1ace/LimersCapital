import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSolanaMarketData, fetchSolPrice } from '../api/prices';
import { fetchTTSEData, TTSE_FALLBACK, TTD_RATE } from '../api/ttse';
import useStore from '../store/useStore';
import StockChart from '../components/StockChart';
import PortfolioValueChart from '../components/PortfolioValueChart';
import WalletBalances from '../components/wallet/WalletBalances';
import TransactionHistory from '../components/wallet/TransactionHistory';
import { useWalletAddress, useWalletConnected, useUserProfile, useTradeLog } from '../solana/hooks';
import { useCluster } from '../solana/provider';
import { getAccountExplorerUrl } from '../solana/config';
import { getTier } from '../data/gamification';
import { useLimerActions } from '../solana/bridge';

const fmtUSD = n => n == null ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtTTD = n => n == null ? '—' : 'TT$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function exportCSV(trades) {
  const headers = ['Date', 'Side', 'Market', 'Symbol', 'Quantity', 'Price', 'Total', 'Currency', 'Fee'];
  const rows = trades.map(t => [
    new Date(t.timestamp).toISOString(),
    t.side.toUpperCase(),
    t.market.toUpperCase(),
    t.symbol,
    t.qty,
    t.price,
    t.total,
    t.currency,
    +(t.total * 0.003).toFixed(6),
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `limerscapital-trades-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PortfolioPage() {
  const [chartAsset, setChartAsset] = useState(null);
  const { balanceUSD, balanceTTD, holdings, trades, resetPortfolio } = useStore();
  const marketQ = useQuery({ queryKey: ['sol-market'], queryFn: fetchSolanaMarketData, staleTime: 30000 });
  const ttseQ = useQuery({ queryKey: ['ttse-data'], queryFn: fetchTTSEData, staleTime: 120000 });
  const tokens = marketQ.data || [];
  const stocks = ttseQ.data?.stocks || TTSE_FALLBACK;

  // Calculate portfolio value
  const solHoldings = holdings.filter(h => h.market === 'solana');
  const ttseHoldings = holdings.filter(h => h.market === 'ttse');

  const solValue = solHoldings.reduce((sum, h) => {
    const t = tokens.find(t => t.symbol?.toUpperCase() === h.symbol?.toUpperCase());
    return sum + h.qty * (t?.current_price || h.avgPrice);
  }, 0);

  const ttseValue = ttseHoldings.reduce((sum, h) => {
    const s = stocks.find(s => s.sym === h.symbol);
    return sum + h.qty * (s?.close || h.avgPrice);
  }, 0);

  const totalUSD = balanceUSD + solValue + (balanceTTD + ttseValue) / TTD_RATE;
  const startUSD = 100000 + 679000 / TTD_RATE;
  const totalPnl = totalUSD - startUSD;
  const totalPnlPct = (totalPnl / startUSD) * 100;

  // On-chain wallet state
  const walletAddress = useWalletAddress();
  const walletConnected = useWalletConnected();
  const { cluster, label: clusterLabel } = useCluster();
  const solPriceQ = useQuery({ queryKey: ['sol-price'], queryFn: fetchSolPrice, staleTime: 60000 });
  const solPrice = solPriceQ.data?.price ?? null;

  // On-chain Limer profile + trade log
  const profileQ = useUserProfile(walletAddress);
  const tradeLogQ = useTradeLog(walletAddress);
  const profile = profileQ.data;
  const tradeLog = tradeLogQ.data;

  // On-chain actions (initialize profile, etc.)
  const limerActions = useLimerActions();

  return (
    <div>
      {/* On-Chain Wallet Section — only shown when wallet connected */}
      {walletConnected && walletAddress && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-sans text-[.92rem] font-bold uppercase tracking-widest text-txt">
              On-Chain Wallet
            </h2>
            <span className={`px-2 py-0.5 rounded text-[.6rem] font-mono uppercase tracking-wider
              ${cluster === 'devnet'
                ? 'bg-[rgba(255,179,71,.1)] text-[#FFB347] border border-[rgba(255,179,71,.25)]'
                : 'bg-up/10 text-up border border-up/25'
              }`}>
              {clusterLabel}
            </span>
            <a
              href={getAccountExplorerUrl(walletAddress, cluster)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[.68rem] text-sea hover:text-txt no-underline transition-colors ml-auto"
            >
              View on Solscan
            </a>
          </div>

          <div className="rounded-2xl border border-sea/20 p-5 mb-4" style={{ background: 'linear-gradient(135deg, rgba(0,200,180,.04), rgba(45,155,86,.02))' }}>
            <WalletBalances walletAddress={walletAddress} solPrice={solPrice} />
          </div>

          <div className="mb-4">
            <h3 className="font-sans text-[.78rem] font-bold uppercase tracking-widest mb-3 text-txt-2">Recent On-Chain Transactions</h3>
            <TransactionHistory walletAddress={walletAddress} />
          </div>

          {/* Limer On-Chain Profile */}
          {profile?.initialized && (
            <div className="rounded-2xl border border-[rgba(45,155,86,.2)] p-5 mb-4"
              style={{ background: 'linear-gradient(135deg, rgba(45,155,86,.04), rgba(0,200,180,.02))' }}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-sans text-[.78rem] font-bold uppercase tracking-widest text-[#2D9B56]">
                  Limer Profile (On-Chain)
                </h3>
                <a href={getAccountExplorerUrl(profile.address, cluster)}
                  target="_blank" rel="noopener noreferrer"
                  className="text-[.6rem] text-sea hover:text-txt no-underline transition-colors ml-auto">
                  View PDA
                </a>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl p-3 border border-border" style={{ background: 'var(--color-card)' }}>
                  <div className="text-[.6rem] text-muted uppercase tracking-widest mb-1">XP</div>
                  <div className="font-serif text-[1.2rem] font-black text-txt">
                    {profile.xp.toLocaleString()}
                  </div>
                  <div className="text-[.6rem] text-txt-2">{getTier(profile.xp).name} {getTier(profile.xp).icon}</div>
                </div>
                <div className="rounded-xl p-3 border border-border" style={{ background: 'var(--color-card)' }}>
                  <div className="text-[.6rem] text-muted uppercase tracking-widest mb-1">Limer Points</div>
                  <div className="font-serif text-[1.2rem] font-black text-[#2D9B56]">
                    {profile.limerPoints.toLocaleString()}
                  </div>
                  <div className="text-[.6rem] text-txt-2">LP</div>
                </div>
                <div className="rounded-xl p-3 border border-border" style={{ background: 'var(--color-card)' }}>
                  <div className="text-[.6rem] text-muted uppercase tracking-widest mb-1">Streak</div>
                  <div className="font-serif text-[1.2rem] font-black text-txt">
                    {profile.currentStreak}
                  </div>
                  <div className="text-[.6rem] text-txt-2">longest: {profile.longestStreak}</div>
                </div>
                <div className="rounded-xl p-3 border border-border" style={{ background: 'var(--color-card)' }}>
                  <div className="text-[.6rem] text-muted uppercase tracking-widest mb-1">Badges</div>
                  <div className="font-serif text-[1.2rem] font-black text-txt">
                    {/* Count set bits in bitmap */}
                    {(profile.badgesEarned >>> 0).toString(2).split('').filter(b => b === '1').length}
                  </div>
                  <div className="text-[.6rem] text-txt-2">earned on-chain</div>
                </div>
              </div>
              {tradeLog?.initialized && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="rounded-xl p-3 border border-border" style={{ background: 'var(--color-card)' }}>
                    <div className="text-[.6rem] text-muted uppercase tracking-widest mb-1">Trades</div>
                    <div className="font-mono text-[.9rem] text-txt">{tradeLog.tradeCount}</div>
                  </div>
                  <div className="rounded-xl p-3 border border-border" style={{ background: 'var(--color-card)' }}>
                    <div className="text-[.6rem] text-muted uppercase tracking-widest mb-1">Volume</div>
                    <div className="font-mono text-[.9rem] text-txt">{fmtUSD(tradeLog.totalVolumeUsd / 1e6)}</div>
                  </div>
                  <div className="rounded-xl p-3 border border-border" style={{ background: 'var(--color-card)' }}>
                    <div className="text-[.6rem] text-muted uppercase tracking-widest mb-1">Fees Paid</div>
                    <div className="font-mono text-[.9rem] text-txt">{fmtUSD(tradeLog.totalFees / 1e6)}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile not initialized prompt */}
          {walletConnected && !profile?.initialized && !profileQ.isLoading && (
            <div className="rounded-2xl border border-dashed border-[rgba(45,155,86,.3)] p-5 mb-4 text-center"
              style={{ background: 'rgba(45,155,86,.03)' }}>
              <div className="text-[.85rem] text-txt mb-1">No on-chain profile yet</div>
              <div className="text-[.72rem] text-txt-2 mb-3">
                Create your Limer profile on {clusterLabel} to track XP, badges, and trade history on-chain.
              </div>
              <button
                onClick={() => limerActions.initializeUser.mutateAsync().then(() => profileQ.refetch())}
                disabled={limerActions.initializeUser.isPending}
                className="px-4 py-1.5 rounded-lg text-[.72rem] font-semibold bg-up/10 text-up border border-up/30
                  hover:bg-up/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {limerActions.initializeUser.isPending ? 'Initializing…' : 'Initialize Profile on-chain'}
              </button>
            </div>
          )}

          {/* Separator between on-chain and paper */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[.65rem] text-muted uppercase tracking-widest">Paper Portfolio</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        </div>
      )}

      {/* Dashboard cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <DashCard label="USD Cash" value={fmtUSD(balanceUSD)} sub="Solana balance" />
        <DashCard label="TTD Cash" value={fmtTTD(balanceTTD)} sub="TTSE balance" color="text-[#FF4D6D]" />
        <DashCard label="Holdings (USD)" value={fmtUSD(solValue + ttseValue / TTD_RATE)} sub={`${solHoldings.length + ttseHoldings.length} positions`} />
        <DashCard
          label="Total P&L"
          value={`${totalPnl >= 0 ? '+' : ''}${fmtUSD(totalPnl)}`}
          sub={`${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}%`}
          color={totalPnl >= 0 ? 'text-up' : 'text-down'}
        />
      </div>

      {/* Portfolio Value Chart */}
      <div className="mb-6">
        <PortfolioValueChart
          trades={trades}
          holdings={holdings}
          solTokens={tokens}
          ttseStocks={stocks}
        />
      </div>

      {/* Price Chart */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-sans text-[.88rem] font-bold uppercase tracking-widest text-txt">📈 Price Chart</h3>
          {holdings.length > 0 && (
            <select
              value={chartAsset ? `${chartAsset.market}:${chartAsset.symbol}` : ''}
              onChange={e => {
                if (!e.target.value) { setChartAsset(null); return; }
                const [mkt, sym] = e.target.value.split(':');
                const h = holdings.find(h => h.market === mkt && h.symbol === sym);
                if (h) {
                  const isTTSE = h.market === 'ttse';
                  const a = isTTSE
                    ? stocks.find(s => s.sym === h.symbol)
                    : tokens.find(t => t.symbol?.toUpperCase() === h.symbol);
                  setChartAsset({
                    symbol: h.symbol, name: a?.name || h.symbol,
                    price: isTTSE ? (a?.close || h.avgPrice) : (a?.current_price || h.avgPrice),
                    currency: h.currency, market: h.market, isTTSE,
                  });
                }
              }}
              className="bg-black/30 border border-border text-txt rounded-lg px-3 py-1.5 font-mono text-[.72rem] outline-none">
              <option value="">— Select holding —</option>
              {holdings.map(h => (
                <option key={`${h.market}:${h.symbol}`} value={`${h.market}:${h.symbol}`}>
                  {h.market === 'ttse' ? '🇹🇹' : '📊'} {h.symbol}
                </option>
              ))}
            </select>
          )}
        </div>
        <StockChart
          symbol={chartAsset?.symbol}
          name={chartAsset?.name}
          price={chartAsset?.price}
          currency={chartAsset?.currency}
          isTTSE={chartAsset?.isTTSE}
        />
      </div>

      {/* Solana Holdings */}
      {solHoldings.length > 0 && (
        <div className="mb-6">
          <h3 className="font-sans text-[.88rem] font-bold uppercase tracking-widest mb-3 text-txt">📊 Solana Positions</h3>
          <div className="flex flex-col gap-0.5">
            {solHoldings.map(h => {
              const t = tokens.find(t => t.symbol?.toUpperCase() === h.symbol?.toUpperCase());
              const cur = t?.current_price || h.avgPrice;
              const pnl = ((cur - h.avgPrice) / h.avgPrice * 100);
              return (
                <div key={`sol:${h.symbol}`} className="flex items-center gap-2 md:gap-4 rounded-xl px-2.5 md:px-4 py-2.5 border border-border text-[.76rem]"
                  style={{ background: 'var(--color-card)' }}>
                  <span className="font-sans font-bold w-14">{h.symbol}</span>
                  <span className="text-txt-2 tabular-nums">{h.qty.toFixed(4)}</span>
                  <span className="hidden md:block text-txt-2">{fmtUSD(h.avgPrice)}</span>
                  <span className="text-txt tabular-nums">{fmtUSD(h.qty * cur)}</span>
                  <span className={`ml-auto tabular-nums ${pnl >= 0 ? 'text-up' : 'text-down'}`}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TTSE Holdings */}
      {ttseHoldings.length > 0 && (
        <div className="mb-6">
          <h3 className="font-sans text-[.88rem] font-bold uppercase tracking-widest mb-3 text-[#FF4D6D]">🇹🇹 TTSE Positions</h3>
          <div className="flex flex-col gap-0.5">
            {ttseHoldings.map(h => {
              const s = stocks.find(s => s.sym === h.symbol);
              const cur = s?.close || h.avgPrice;
              const pnl = ((cur - h.avgPrice) / h.avgPrice * 100);
              return (
                <div key={`ttse:${h.symbol}`} className="flex items-center gap-2 md:gap-4 rounded-xl px-2.5 md:px-4 py-2.5 border border-[rgba(200,16,46,.15)] text-[.76rem]"
                  style={{ background: 'var(--color-card)' }}>
                  <span className="font-sans font-bold w-14">{h.symbol}</span>
                  <span className="text-txt-2 tabular-nums">{h.qty.toFixed(0)} <span className="hidden md:inline">shares</span></span>
                  <span className="hidden md:block text-txt-2">{fmtTTD(h.avgPrice)}</span>
                  <span className="text-txt tabular-nums">{fmtTTD(h.qty * cur)}</span>
                  <span className={`ml-auto tabular-nums ${pnl >= 0 ? 'text-up' : 'text-down'}`}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-sans text-[.92rem] font-bold uppercase tracking-widest text-txt">All Activity</h2>
        <div className="flex gap-2">
          {trades.length > 0 && (
            <button onClick={() => exportCSV(trades)}
              className="bg-transparent border border-sea/30 text-sea cursor-pointer rounded-lg px-3 py-1 text-[.7rem] font-mono transition-all hover:bg-sea/10">
              ↓ Export CSV
            </button>
          )}
          <button onClick={resetPortfolio}
            className="bg-transparent border border-down/25 text-down cursor-pointer rounded-lg px-3 py-1 text-[.7rem] font-mono transition-all hover:bg-down/10">
            Reset Portfolio
          </button>
        </div>
      </div>

      {trades.length === 0 ? (
        <div className="text-muted text-sm py-8 text-center border border-border rounded-xl" style={{ background: 'var(--color-card)' }}>
          No trades yet. Head to Paper Trade to get started!
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {trades.map(t => (
            <div key={t.id} className="flex items-center gap-3 rounded-xl px-4 py-2 border border-border text-[.74rem]"
              style={{ background: 'var(--color-card)' }}>
              <span className={`px-1.5 py-0.5 rounded text-[.62rem] font-semibold uppercase
                ${t.side === 'buy' ? 'bg-up/12 text-up' : 'bg-down/12 text-down'}`}>{t.side}</span>
              <span className={`text-[.58rem] px-1.5 py-0.5 rounded ${t.market === 'ttse' ? 'bg-[rgba(200,16,46,.08)] text-[#FF4D6D]' : 'bg-sea/8 text-sea'}`}>
                {t.market === 'ttse' ? 'TTSE' : 'SOL'}
              </span>
              <span className="font-sans font-bold flex-1">{t.symbol}</span>
              <span className="text-txt-2">
                {t.qty < 1 ? t.qty.toFixed(4) : t.qty.toFixed(2)} @ {t.currency === 'TTD' ? fmtTTD(t.price) : fmtUSD(t.price)}
              </span>
              <span className="text-muted text-[.65rem] ml-auto">{new Date(t.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DashCard({ label, value, sub, color }) {
  return (
    <div className="rounded-[14px] p-5 border border-border" style={{ background: 'var(--color-card)' }}>
      <div className="text-[.66rem] text-muted uppercase tracking-widest mb-1.5">{label}</div>
      <div className={`font-serif text-[1.6rem] font-black ${color || 'text-txt'}`}>{value}</div>
      {sub && <div className={`text-[.7rem] mt-0.5 ${color || 'text-txt-2'}`}>{sub}</div>}
    </div>
  );
}
