/**
 * Check whether a wallet owns a Terminal Access Pass.
 *
 * Uses the existing Helius DAS proxy (`/das`) in our Cloudflare Worker
 * to call getAssetsByOwner without shipping the API key to the browser.
 * Filters results by name prefix — our passes are minted with a known
 * `name` and `uri`, so matching on name is sufficient for MVP.
 */

import { ACCESS_PASS_NAME } from './terminalPass';

const PROXY = (import.meta.env.VITE_API_PROXY_URL || '').replace(/\/$/, '');

/**
 * @param {string} walletAddress — base58 public key
 * @returns {Promise<{hasPass: boolean, passAddress: string|null, name?: string}>}
 */
export async function hasAccessPass(walletAddress) {
  if (!walletAddress) return { hasPass: false, passAddress: null };

  // If the worker proxy isn't configured (local dev), we can't verify — treat
  // as no-pass and let the Supabase `tier='pro'` admin path cover the gap.
  if (!PROXY) {
    return { hasPass: false, passAddress: null, reason: 'proxy-not-configured' };
  }

  try {
    const res = await fetch(`${PROXY}/das`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'terminal-pass-check',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: walletAddress,
          page: 1,
          limit: 50,
          displayOptions: { showCollectionMetadata: false, showFungible: false },
        },
      }),
    });
    if (!res.ok) {
      return { hasPass: false, passAddress: null, reason: `das-${res.status}` };
    }
    const data = await res.json();
    const items = data?.result?.items || [];
    const pass = items.find(item => {
      const name = item?.content?.metadata?.name || item?.content?.json?.name || '';
      return typeof name === 'string' && name.toLowerCase().includes('terminal access pass');
    });
    if (!pass) return { hasPass: false, passAddress: null };
    return { hasPass: true, passAddress: pass.id, name: pass.content?.metadata?.name };
  } catch (e) {
    console.warn('[checkPass] DAS query failed:', e?.message || e);
    return { hasPass: false, passAddress: null, reason: 'network-error' };
  }
}

export { ACCESS_PASS_NAME };
