import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelectedWalletAccount, useSignAndSendTransaction } from '@solana/react';
import useStore from '../../store/useStore';
import GlassCard from '../ui/GlassCard';
import { useRpc, useCluster } from '../../solana/provider';
import { mintAccessPass } from '../../solana/terminalPass';
import { hasAccessPass } from '../../solana/checkPass';
import { getTxExplorerUrl, getAccountExplorerUrl } from '../../solana/config';

const STEP_CONNECT = 0;
const STEP_FUND    = 1;
const STEP_MINT    = 2;
const STEP_DONE    = 3;

function StepDots({ step }) {
  return (
    <div className="flex items-center gap-1.5 mb-5">
      {[0, 1, 2, 3].map(i => (
        <div key={i}
             className={`h-1.5 flex-1 rounded-full transition-all ${
               i === step ? 'bg-sea' : i < step ? 'bg-sea/40' : 'bg-white/10'
             }`} />
      ))}
    </div>
  );
}

/**
 * Public wrapper — `useSignAndSendTransaction` from @solana/react crashes
 * if called with a null account (it reads `account.chains.includes(...)`
 * internally). We guard at this level and only mount the inner component
 * when the account is guaranteed non-null, matching the SwapPanel pattern.
 */
export default function AccessPassClaim() {
  // Tuple: [account, setAccount]. Destructure — passing the tuple itself
  // to useSignAndSendTransaction causes a `.chains.includes` crash because
  // the hook reads `account.chains` off what it thinks is a single account.
  const [selectedAccount] = useSelectedWalletAccount();
  const setActiveTab = useStore(s => s.setActiveTab);
  if (!selectedAccount) {
    return (
      <GlassCard variant="elevated" className="max-w-xl p-7 text-center">
        <div className="text-[.6rem] uppercase tracking-[.3em] text-muted font-mono mb-3">
          Terminal · Elite Club
        </div>
        <h2 className="font-headline text-2xl font-black italic mb-3">
          Connect a <span className="text-sea">Solana wallet</span> to continue
        </h2>
        <p className="text-txt-2 text-sm leading-relaxed mb-4">
          Use the <span className="text-txt font-semibold">Connect</span> button in the header.
        </p>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="text-[.7rem] text-muted hover:text-txt transition-colors underline underline-offset-4"
        >
          back to dashboard
        </button>
      </GlassCard>
    );
  }
  return <AccessPassClaimInner account={selectedAccount} />;
}

function AccessPassClaimInner({ account: selectedAccount }) {
  const { cluster } = useCluster();
  const rpc = useRpc();
  const setUserTier  = useStore(s => s.setUserTier);
  const setPassAddr  = useStore(s => s.setPassAddress);
  const setActiveTab = useStore(s => s.setActiveTab);

  const chain = `solana:${cluster === 'mainnet-beta' ? 'mainnet' : cluster}`;
  // Safe now — selectedAccount is guaranteed non-null by the outer wrapper.
  const signAndSendTransaction = useSignAndSendTransaction(selectedAccount, chain);

  const [step, setStep]       = useState(STEP_CONNECT);
  const [balance, setBalance] = useState(null);
  const [mintResult, setMint] = useState(null);
  const [airdropSig, setAirdropSig] = useState(null);
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState(null);
  const [phase, setPhase]     = useState(null);

  // Step transitions based on wallet/balance state.
  useEffect(() => {
    if (!selectedAccount) {
      setStep(STEP_CONNECT);
      return;
    }
    if (mintResult) {
      setStep(STEP_DONE);
      return;
    }
    if (balance == null) return;
    setStep(balance < 0.01 ? STEP_FUND : STEP_MINT);
  }, [selectedAccount, balance, mintResult]);

  // Fetch balance when wallet connects.
  useEffect(() => {
    if (!selectedAccount || !rpc) { setBalance(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const { value } = await rpc.getBalance(selectedAccount.address, { commitment: 'confirmed' }).send();
        if (!cancelled) setBalance(Number(value) / 1_000_000_000);
      } catch (e) {
        if (!cancelled) { setBalance(0); }
      }
    })();
    return () => { cancelled = true; };
  }, [selectedAccount, rpc, mintResult]);

  async function handleAirdrop() {
    if (!selectedAccount || !rpc) return;
    setBusy(true); setError(null); setPhase('requesting airdrop…');
    try {
      const sig = await rpc.requestAirdrop(selectedAccount.address, 1_000_000_000n).send();
      setAirdropSig(sig);
      // Poll for balance increase (devnet airdrop often lands in <10s)
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 1200));
        const { value } = await rpc.getBalance(selectedAccount.address, { commitment: 'confirmed' }).send();
        const sol = Number(value) / 1_000_000_000;
        setBalance(sol);
        if (sol >= 0.01) break;
      }
      setPhase(null);
    } catch (e) {
      setError(e.message || 'Airdrop failed. Devnet faucet sometimes rate-limits — try again in a minute.');
      setPhase(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleMint() {
    if (!selectedAccount || !signAndSendTransaction) return;
    setBusy(true); setError(null);
    try {
      const result = await mintAccessPass({
        account: selectedAccount,
        signAndSendTransaction,
        cluster,
        onStatusChange: setPhase,
      });
      setMint(result);
      setPassAddr(result.assetAddress);
      setUserTier('pro');
      setPhase(null);
    } catch (e) {
      const msg = e?.message || 'Mint failed';
      setError(msg.length > 200 ? msg.slice(0, 200) + '…' : msg);
      setPhase(null);
    } finally {
      setBusy(false);
    }
  }

  function enterTerminal() {
    setActiveTab('terminal');
  }

  return (
    <GlassCard variant="elevated" className="max-w-xl p-7">
      <StepDots step={step} />
      <div className="text-[.6rem] uppercase tracking-[.3em] text-gold font-mono mb-2">
        Terminal · Elite Club · Step {step + 1} / 4
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {step === STEP_CONNECT && <ConnectView />}
          {step === STEP_FUND    && (
            <FundView
              balance={balance}
              busy={busy}
              phase={phase}
              airdropSig={airdropSig}
              cluster={cluster}
              onAirdrop={handleAirdrop}
            />
          )}
          {step === STEP_MINT    && (
            <MintView
              balance={balance}
              busy={busy}
              phase={phase}
              cluster={cluster}
              onMint={handleMint}
            />
          )}
          {step === STEP_DONE    && (
            <DoneView
              mintResult={mintResult}
              onEnter={enterTerminal}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {error && (
        <div className="mt-4 p-3 rounded-md bg-down/10 border border-down/30 text-[.7rem] text-down font-mono">
          ⚠ {error}
        </div>
      )}
    </GlassCard>
  );
}

// ─── Step views ────────────────────────────────────────────────

function ConnectView() {
  return (
    <>
      <h2 className="font-headline text-2xl font-black italic mb-3">
        Connect your <span className="text-sea">Solana wallet</span>
      </h2>
      <p className="text-txt-2 text-sm leading-relaxed mb-4">
        Use the <span className="text-txt font-semibold">Connect</span> button in the header. Phantom and Solflare
        are supported on devnet. Your pass will live in your wallet — visible, portable, verifiably yours.
      </p>
      <div className="text-[.65rem] text-muted font-mono">waiting for wallet…</div>
    </>
  );
}

function FundView({ balance, busy, phase, airdropSig, cluster, onAirdrop }) {
  return (
    <>
      <h2 className="font-headline text-2xl font-black italic mb-3">
        Fund with <span className="text-sea">devnet SOL</span>
      </h2>
      <p className="text-txt-2 text-sm leading-relaxed mb-4">
        The mint transaction costs about <span className="text-txt font-mono">0.002 SOL</span> in rent + fees.
        We'll airdrop 1 devnet SOL — it's test money, not real value.
      </p>
      <div className="text-[.7rem] font-mono text-txt-2 mb-3">
        Current balance: <span className={balance < 0.01 ? 'text-down' : 'text-sea'}>{balance?.toFixed(4) ?? '—'} SOL</span>
      </div>
      <button
        onClick={onAirdrop}
        disabled={busy}
        className="px-5 py-2 rounded-md text-[.72rem] uppercase tracking-widest font-headline font-bold bg-sea text-night disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {busy ? phase || 'Working…' : '▸ Airdrop 1 devnet SOL'}
      </button>
      {airdropSig && (
        <div className="mt-3 text-[.65rem] font-mono">
          <a
            href={getTxExplorerUrl(airdropSig, cluster)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sea hover:text-txt underline underline-offset-2"
          >
            airdrop tx ↗
          </a>
        </div>
      )}
    </>
  );
}

function MintView({ balance, busy, phase, cluster, onMint }) {
  return (
    <>
      <h2 className="font-headline text-2xl font-black italic mb-3">
        Claim your <span className="text-gold">Access Pass</span>
      </h2>
      <p className="text-txt-2 text-sm leading-relaxed mb-4">
        Mints a <span className="text-txt font-semibold">Limer's Terminal Access Pass</span> NFT to your wallet using
        Metaplex Core. The Terminal will unlock as soon as the mint confirms.
      </p>
      <div className="grid grid-cols-2 gap-2 text-[.62rem] text-txt-2 mb-4 font-mono">
        <div>· Balance <span className="text-sea">{balance?.toFixed(4)} SOL</span></div>
        <div>· Standard <span className="text-sea">mpl-core</span></div>
        <div>· Network <span className="text-sea">{cluster}</span></div>
        <div>· Supply <span className="text-sea">1 / wallet</span></div>
      </div>
      <button
        onClick={onMint}
        disabled={busy}
        className="px-5 py-2 rounded-md text-[.72rem] uppercase tracking-widest font-headline font-bold bg-gold text-night disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {busy ? phase || 'Minting…' : '⚡ Sign & mint Access Pass'}
      </button>
    </>
  );
}

function DoneView({ mintResult, onEnter }) {
  return (
    <>
      <h2 className="font-headline text-2xl font-black italic mb-3">
        Welcome to the <span className="text-gold">Elite Club</span>
      </h2>
      <div className="p-4 rounded-lg bg-gradient-to-br from-gold/10 to-sea/10 border border-gold/30 mb-4">
        <div className="text-[.6rem] uppercase tracking-[.3em] text-gold font-mono mb-1">
          Your access pass · on-chain
        </div>
        <div className="font-mono text-[.7rem] text-txt break-all mb-3">
          {mintResult?.assetAddress}
        </div>
        <div className="flex flex-wrap gap-3 text-[.65rem] font-mono">
          <a href={mintResult?.explorerAssetUrl} target="_blank" rel="noopener noreferrer"
             className="text-sea hover:text-txt underline underline-offset-2">
            view asset ↗
          </a>
          <a href={mintResult?.explorerTxUrl} target="_blank" rel="noopener noreferrer"
             className="text-sea hover:text-txt underline underline-offset-2">
            mint tx ↗
          </a>
        </div>
      </div>
      <p className="text-txt-2 text-sm mb-4">
        The pass is now visible in your Solflare / Phantom wallet. Terminal access is gated by holding it —
        rotating wallets or burning it reverts you to free tier.
      </p>
      <button
        onClick={onEnter}
        className="px-5 py-2 rounded-md text-[.72rem] uppercase tracking-widest font-headline font-bold bg-sea text-night"
      >
        ▸ Enter the Terminal
      </button>
    </>
  );
}
