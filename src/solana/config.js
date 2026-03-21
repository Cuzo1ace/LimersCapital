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

// Trusted RPC domains — only these are allowed for custom VITE_SOLANA_RPC_URL
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
  'workers.dev',       // Cloudflare Workers (our API proxy)
  'limerscapital.com', // Our own domain
  'localhost',
  '127.0.0.1',
];

function isRpcUrlTrusted(url) {
  try {
    const parsed = new URL(url);
    // Must be https (or localhost for dev)
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return true;
    if (parsed.protocol !== 'https:') return false;
    // Check against trusted domain list
    return TRUSTED_RPC_DOMAINS.some(domain => parsed.hostname === domain || parsed.hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
}

export function createRpc(cluster = DEFAULT_CLUSTER) {
  const envUrl = import.meta.env.VITE_SOLANA_RPC_URL;

  // If custom RPC URL is set, validate it against trusted domains
  if (envUrl) {
    if (isRpcUrlTrusted(envUrl)) {
      return createSolanaRpc(envUrl);
    }
    console.warn('[Solana] VITE_SOLANA_RPC_URL rejected — domain not in trusted list. Falling back to public RPC.');
  }

  const url = CLUSTERS[cluster]?.rpc || CLUSTERS[DEFAULT_CLUSTER].rpc;
  return createSolanaRpc(url);
}

export function getExplorerUrl(cluster = DEFAULT_CLUSTER) {
  return CLUSTERS[cluster]?.explorer || CLUSTERS[DEFAULT_CLUSTER].explorer;
}

export function getAccountExplorerUrl(address, cluster = DEFAULT_CLUSTER) {
  const base = getExplorerUrl(cluster);
  const clusterParam = cluster === 'devnet' ? '?cluster=devnet' : '';
  return `${base.replace(/\?.*$/, '')}/account/${address}${clusterParam}`;
}

export function getTxExplorerUrl(signature, cluster = DEFAULT_CLUSTER) {
  const base = getExplorerUrl(cluster);
  const clusterParam = cluster === 'devnet' ? '?cluster=devnet' : '';
  return `${base.replace(/\?.*$/, '')}/tx/${signature}${clusterParam}`;
}
