import { useEffect } from 'react';
import { useSelectedWalletAccount } from '@solana/react';
import useStore from '../store/useStore';
import { hasAccessPass } from './checkPass';

/**
 * Whenever the connected wallet changes, query the DAS proxy for an
 * on-chain Access Pass owned by that wallet. If found, flip the local
 * Zustand `userTier` to 'pro' and store the asset address. If not, we
 * preserve any admin-set 'pro' flag (so manual QA / demo overrides keep
 * working) but clear the pass address so gating is honest about what's
 * actually on-chain.
 *
 * Mount this hook once near the app root (App.jsx or SolanaProvider).
 */
export function useAccessPassSync() {
  const [selectedAccount] = useSelectedWalletAccount();
  const setUserTier   = useStore(s => s.setUserTier);
  const setPassAddr   = useStore(s => s.setPassAddress);
  const currentTier   = useStore(s => s.userTier);
  const currentPass   = useStore(s => s.passAddress);

  useEffect(() => {
    if (!selectedAccount?.address) {
      // Wallet disconnected → clear the pass; leave tier alone so admins
      // flipping tier='pro' in Supabase for dev still see the Terminal.
      if (currentPass) setPassAddr(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const result = await hasAccessPass(selectedAccount.address);
      if (cancelled) return;
      if (result.hasPass) {
        setPassAddr(result.passAddress);
        if (currentTier !== 'pro') setUserTier('pro');
      } else {
        setPassAddr(null);
        // Don't demote here — the user may have the admin override set,
        // or the DAS proxy may have transiently failed. We only promote.
      }
    })();
    return () => { cancelled = true; };
  }, [selectedAccount?.address, setUserTier, setPassAddr]);  // eslint-disable-line react-hooks/exhaustive-deps
}
