import { motion } from 'framer-motion';
import { useSelectedWalletAccount } from '@solana/react';
import useStore from '../../store/useStore';
import GlassCard from '../ui/GlassCard';
import LiquidMetalButton from '../ui/LiquidMetalButton';
import AccessPassClaim from './AccessPassClaim';

export default function PremiumGate({ children }) {
  const userTier = useStore(s => s.userTier);
  const setActiveTab = useStore(s => s.setActiveTab);
  // useSelectedWalletAccount returns a tuple [account, setter]; destructure
  // so we hand the actual account object (not an array) to child hooks.
  const [selectedAccount] = useSelectedWalletAccount();

  if (userTier === 'pro') return children;

  const walletConnected = !!selectedAccount;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 py-6">
      {/* Marketing panel */}
      <GlassCard variant="elevated" className="max-w-xl p-7 text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="text-[.65rem] uppercase tracking-[.3em] text-gold font-mono mb-3">
            Terminal · Elite Club
          </div>
          <h1 className="font-headline text-3xl md:text-4xl font-black italic mb-3">
            Unlock the <span className="text-gold">institutional</span> toolkit
          </h1>
          <p className="text-muted text-sm leading-relaxed mb-5">
            Portfolio look-through, Monte Carlo, Claude co-pilot, MCP endpoint — all gated by
            an on-chain Access Pass that lives in your wallet.
          </p>
          <div className="grid grid-cols-2 gap-2 text-[.68rem] text-txt-2 mb-2 text-left font-mono">
            <div>· Portfolio look-through</div>
            <div>· Monte Carlo (1,000+ paths)</div>
            <div>· Caribbean macro + FX</div>
            <div>· Insider &amp; on-chain flows</div>
            <div>· Claude chat co-pilot</div>
            <div>· MCP endpoint for your agent</div>
            <div>· Regional exposure lens</div>
            <div>· Find-gems guided tour</div>
          </div>
        </motion.div>
      </GlassCard>

      {/* Claim flow or waitlist fallback */}
      {walletConnected ? (
        <AccessPassClaim />
      ) : (
        <GlassCard className="max-w-xl p-6 text-center">
          <div className="text-[.6rem] uppercase tracking-[.3em] text-sea font-mono mb-2">
            Step 1 · Connect wallet
          </div>
          <p className="text-txt-2 text-sm leading-relaxed mb-4">
            Connect Phantom or Solflare on devnet using the <span className="text-txt font-semibold">Connect</span>{' '}
            button in the header. After that you'll be able to mint your Access Pass right here.
          </p>
          <div className="flex items-center justify-center gap-3">
            <LiquidMetalButton
              label="No wallet yet — join waitlist"
              onClick={() => setActiveTab('community')}
            />
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-[.7rem] text-muted hover:text-txt transition-colors underline underline-offset-4"
            >
              back to dashboard
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
