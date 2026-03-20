import { createContext, useContext, useMemo } from 'react';
import { SelectedWalletAccountContextProvider, useSelectedWalletAccount } from '@solana/react';
import { createRpc, CLUSTERS, DEFAULT_CLUSTER } from './config';
import useStore from '../store/useStore';

// RPC context
const RpcContext = createContext(null);

export function useRpc() {
  return useContext(RpcContext);
}

// Wallet storage helpers — persist selected wallet name to localStorage
// Only the wallet name/key is stored, NOT the address or any sensitive data.
// The wallet-standard library uses this to reconnect to the same wallet on reload.
const WALLET_STORAGE_KEY = 'caribcrypto-selected-wallet';

const walletStateSync = {
  getSelectedWallet: () => {
    try { return localStorage.getItem(WALLET_STORAGE_KEY); } catch { return null; }
  },
  storeSelectedWallet: (accountKey) => {
    try { localStorage.setItem(WALLET_STORAGE_KEY, accountKey); } catch {}
  },
  deleteSelectedWallet: () => {
    try { localStorage.removeItem(WALLET_STORAGE_KEY); } catch {}
  },
};

// Filter wallets: only accept wallets that implement Solana signing features.
// The wallet-standard `features` property lists what the wallet supports.
// We check for 'solana:signTransaction' or 'standard:connect' to ensure it's a real Solana wallet.
function filterWallets(wallet) {
  if (!wallet || !wallet.features) return false;
  const features = Array.isArray(wallet.features) ? wallet.features : Object.keys(wallet.features);
  return features.some(f =>
    f === 'solana:signTransaction' ||
    f === 'solana:signAndSendTransaction' ||
    f === 'solana:signMessage'
  );
}

export function SolanaProvider({ children }) {
  const cluster = useStore((s) => s.cluster);

  const rpc = useMemo(() => createRpc(cluster), [cluster]);

  return (
    <RpcContext.Provider value={rpc}>
      <SelectedWalletAccountContextProvider
        filterWallets={filterWallets}
        stateSync={walletStateSync}
      >
        {children}
      </SelectedWalletAccountContextProvider>
    </RpcContext.Provider>
  );
}

// Hook to get cluster info
export function useCluster() {
  const cluster = useStore((s) => s.cluster);
  const setCluster = useStore((s) => s.setCluster);
  const info = CLUSTERS[cluster] || CLUSTERS[DEFAULT_CLUSTER];
  return { cluster, setCluster, ...info };
}
