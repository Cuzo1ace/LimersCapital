import { address } from '@solana/kit';

/**
 * Fetch recent transaction signatures for a wallet.
 * Returns simplified transaction info for display.
 */
export async function fetchRecentTransactions(rpc, walletAddress, limit = 10) {
  const signatures = await rpc
    .getSignaturesForAddress(address(walletAddress), { limit, commitment: 'confirmed' })
    .send();

  return signatures.map(sig => ({
    signature: sig.signature,
    slot: sig.slot,
    timestamp: sig.blockTime ? new Date(Number(sig.blockTime) * 1000).toISOString() : null,
    status: sig.err ? 'failed' : 'success',
    memo: sig.memo || null,
  }));
}
