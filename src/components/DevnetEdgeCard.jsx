import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import { useCluster } from '../solana/provider';
import { useWalletAddress, useWalletConnected } from '../solana/hooks';
import { listTokens } from '../solana/tokens';
import { listPools } from '../solana/amm-swap';
import ammConfig from '../solana/generated/amm-config.json';
import faucetRecord from '../solana/generated/faucet.json';
import { getAccountExplorerUrl } from '../solana/config';

const LIMER_PROGRAM = 'HuCCEkDvYdm1EMs3EH9wzLYi53aVkE7orkGXma8azhFk';
const FAUCET_CLAIM_HUMAN = faucetRecord.claimAmountHuman || 10000;
const API_PROXY =
  import.meta.env.VITE_API_PROXY_URL ||
  'https://limer-api-proxy.solanacaribbean-team.workers.dev';

/**
 * DevnetEdgeCard — surfaces the live on-chain footprint on PortfolioPage.
 *
 * The flagship has real devnet infrastructure that was previously only
 * visible on DashboardPage (SwapPanel + TokensPanel). Users who live on
 * the Portfolio page couldn't see that they have a working devnet
 * experience waiting for them. This card closes that gap with a single
 * informational surface:
 *
 *  - health pill (both programs + AMM + N pools live)
 *  - list of tokenized TTSE equities available as real SPL tokens
 *  - one-click mTTDC faucet claim (10K per wallet per 24h)
 *  - secondary CTA to open the devnet swap
 *
 * Descriptive only — no performance claims. Frames the on-chain reality
 * as an edge the user already has access to, matching the Signal pillar
 * of the product philosophy.
 */
export default function DevnetEdgeCard() {
  const { cluster } = useCluster();
  const walletAddress = useWalletAddress();
  const walletConnected = useWalletConnected();
  const setActiveTab = useStore((s) => s.setActiveTab);

  const [claim, setClaim] = useState({ status: 'idle', message: '' });

  const equities = useMemo(
    () => listTokens(cluster).filter((t) => t.category === 'equity'),
    [cluster]
  );
  const pools = useMemo(() => listPools(), []);

  // Only meaningful on devnet — gate the card.
  if (cluster !== 'devnet') return null;

  async function handleClaim() {
    if (!walletAddress || claim.status === 'pending') return;
    setClaim({ status: 'pending', message: `Claiming ${FAUCET_CLAIM_HUMAN.toLocaleString()} mTTDC…` });
    try {
      const res = await fetch(`${API_PROXY}/faucet/mttdc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setClaim({
          status: 'error',
          message: j?.error
            ? `${j.error}${j.retryAfterHuman ? ` (retry in ${j.retryAfterHuman})` : ''}`
            : `Claim failed (HTTP ${res.status})`,
        });
        return;
      }
      setClaim({
        status: 'success',
        message: `Received ${FAUCET_CLAIM_HUMAN.toLocaleString()} mTTDC · tx ${String(j.txSignature || '').slice(0, 10)}…`,
      });
    } catch (err) {
      setClaim({
        status: 'error',
        message: `Network error: ${String(err?.message || err).slice(0, 80)}`,
      });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border p-5 mb-5"
      style={{
        background:
          'linear-gradient(135deg, rgba(196,108,255,.06), rgba(0,255,163,.04))',
        borderColor: 'rgba(196,108,255,.22)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-base">◎</span>
          <div className="text-[.66rem] font-mono font-bold uppercase tracking-widest" style={{ color: '#C46CFF' }}>
            On-Chain Edge · Devnet
          </div>
        </div>
        <div className="text-[.58rem] font-mono uppercase tracking-wider text-txt-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-up animate-pulse" />
            {pools.length} pools live · 30 bps fee · AMM {ammConfig.programId.slice(0, 6)}…
          </span>
        </div>
      </div>

      {/* Program health tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
        <ProgramTile label="Limer Profile" address={LIMER_PROGRAM} cluster={cluster} />
        <ProgramTile label="Limer AMM" address={ammConfig.programId} cluster={cluster} />
        <ProgramTile label="mTTDC Mint" address={faucetRecord.mttdcMint} cluster={cluster} />
        <ProgramTile label="Faucet Vault" address={faucetRecord.faucetPubkey} cluster={cluster} />
      </div>

      {/* Tokenized equities list */}
      {equities.length > 0 && (
        <div className="rounded-xl border border-border p-3 mb-3" style={{ background: 'var(--color-card)' }}>
          <div className="text-[.58rem] font-mono uppercase tracking-wider text-muted mb-2">
            Tokenized TTSE equities available to hold · SPL tokens on devnet
          </div>
          <div className="flex flex-wrap gap-1.5">
            {equities.slice(0, 8).map((t) => {
              const pool = pools.find((p) => p.aSymbol === t.symbol || p.bSymbol === t.symbol);
              return (
                <a
                  key={t.symbol}
                  href={getAccountExplorerUrl(t.mint, cluster)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[.62rem] font-mono px-2 py-1 rounded-lg border border-[#C46CFF]/20 bg-[#C46CFF]/6 text-[#C46CFF] hover:bg-[#C46CFF]/12 transition-colors no-underline"
                  title={t.name}
                >
                  {t.symbol}
                  {t.sector && <span className="text-[.52rem] text-txt-2">· {t.sector}</span>}
                  {pool && <span className="text-[.52rem] text-up">· swap-ready</span>}
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleClaim}
          disabled={!walletConnected || claim.status === 'pending'}
          className={`text-[.72rem] font-bold px-4 py-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
            ${claim.status === 'success'
              ? 'bg-up/12 border-up/30 text-up'
              : claim.status === 'error'
                ? 'bg-down/10 border-down/25 text-down'
                : 'bg-[#C46CFF]/10 border-[#C46CFF]/30 text-[#C46CFF] hover:bg-[#C46CFF]/20'
            }`}
          title={!walletConnected ? 'Connect your wallet to claim' : undefined}
        >
          {claim.status === 'pending' ? 'Claiming…'
            : claim.status === 'success' ? `+${FAUCET_CLAIM_HUMAN.toLocaleString()} mTTDC`
            : claim.status === 'error' ? 'Claim failed'
            : `Claim ${FAUCET_CLAIM_HUMAN.toLocaleString()} mTTDC →`}
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="text-[.72rem] font-semibold px-4 py-1.5 rounded-lg border border-border text-txt-2 hover:text-txt hover:border-txt/30 transition-all cursor-pointer bg-transparent"
        >
          Open Swap →
        </button>
        {!walletConnected && (
          <span className="text-[.6rem] font-mono text-muted">
            Connect a wallet to claim + swap
          </span>
        )}
      </div>

      {/* Claim status message */}
      {claim.message && claim.status !== 'idle' && (
        <div className={`mt-3 text-[.64rem] font-mono leading-relaxed
          ${claim.status === 'success' ? 'text-up' : claim.status === 'error' ? 'text-down' : 'text-txt-2'}`}>
          {claim.message}
        </div>
      )}
    </motion.div>
  );
}

function ProgramTile({ label, address, cluster }) {
  return (
    <a
      href={getAccountExplorerUrl(address, cluster)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-xl px-3 py-2 border border-border hover:border-[#C46CFF]/30 transition-colors no-underline"
      style={{ background: 'var(--color-card)' }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-up flex-shrink-0" />
      <div className="min-w-0">
        <div className="text-[.56rem] font-mono uppercase tracking-widest text-muted truncate">{label}</div>
        <div className="text-[.66rem] font-mono text-txt truncate">{address.slice(0, 6)}…{address.slice(-4)}</div>
      </div>
    </a>
  );
}
