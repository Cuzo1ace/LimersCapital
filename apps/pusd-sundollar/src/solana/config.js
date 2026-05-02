import { createSolanaRpc } from '@solana/kit';

export const CLUSTERS = {
  devnet: {
    rpc: 'https://api.devnet.solana.com',
    label: 'Devnet',
    explorer: 'https://solscan.io/?cluster=devnet',
  },
  'mainnet-beta': {
    rpc: 'https://api.mainnet-beta.solana.com',
    label: 'Mainnet',
    explorer: 'https://solscan.io',
  },
};

export const DEFAULT_CLUSTER = 'devnet';

const TRUSTED_RPC_DOMAINS = [
  'solana.com',
  'helius-rpc.com',
  'helius.dev',
  'quiknode.pro',
  'quicknode.com',
  'triton.one',
  'rpcpool.com',
  'genesysgo.net',
  'ankr.com',
  'alchemy.com',
  'workers.dev',
  'localhost',
  '127.0.0.1',
];

function isRpcUrlTrusted(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return true;
    if (parsed.protocol !== 'https:') return false;
    return TRUSTED_RPC_DOMAINS.some(
      (d) => parsed.hostname === d || parsed.hostname.endsWith('.' + d)
    );
  } catch {
    return false;
  }
}

export function createRpc(cluster = DEFAULT_CLUSTER) {
  const envUrl = import.meta.env.VITE_SOLANA_RPC_URL;
  if (envUrl) {
    if (isRpcUrlTrusted(envUrl)) return createSolanaRpc(envUrl);
    console.warn('[SendJuice] VITE_SOLANA_RPC_URL rejected — domain not trusted. Falling back to public RPC.');
  }
  const url = CLUSTERS[cluster]?.rpc || CLUSTERS[DEFAULT_CLUSTER].rpc;
  return createSolanaRpc(url);
}

export function getTxExplorerUrl(signature, cluster = DEFAULT_CLUSTER) {
  const base = CLUSTERS[cluster]?.explorer || CLUSTERS[DEFAULT_CLUSTER].explorer;
  const clusterParam = cluster === 'devnet' ? '?cluster=devnet' : '';
  return `${base.replace(/\?.*$/, '')}/tx/${signature}${clusterParam}`;
}

export function getAccountExplorerUrl(address, cluster = DEFAULT_CLUSTER) {
  const base = CLUSTERS[cluster]?.explorer || CLUSTERS[DEFAULT_CLUSTER].explorer;
  const clusterParam = cluster === 'devnet' ? '?cluster=devnet' : '';
  return `${base.replace(/\?.*$/, '')}/account/${address}${clusterParam}`;
}
