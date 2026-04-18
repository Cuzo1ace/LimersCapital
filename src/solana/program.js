import { Program, AnchorProvider } from '@anchor-lang/core';
import { Connection, PublicKey } from '@solana/web3.js';
import { CLUSTERS, DEFAULT_CLUSTER } from './config';
// Static import — see commentary in amm-program.js. Dynamic JSON imports
// were flaky in Vite production builds.
import limerIdl from './idl/limer.json';

// Program ID — updated after `anchor deploy`
const PROGRAM_ID_STRING = 'HuCCEkDvYdm1EMs3EH9wzLYi53aVkE7orkGXma8azhFk';

let _programId = null;
export function getLimerProgramId() {
  if (!_programId) {
    _programId = new PublicKey(PROGRAM_ID_STRING);
  }
  return _programId;
}

/**
 * Create an Anchor Program instance for the Limer program (requires wallet for signing).
 *
 * Constructor note: @anchor-lang/core@1.0.0 uses `(idl, provider, coder?)` and reads
 * programId from `idl.address`. See amm-program.js for the full explanation of why
 * the 3-arg legacy signature throws "Cannot read properties of undefined (reading 'size')".
 */
export async function getLimerProgram(wallet, cluster = DEFAULT_CLUSTER) {
  const endpoint = CLUSTERS[cluster]?.rpc || CLUSTERS[DEFAULT_CLUSTER].rpc;
  const connection = new Connection(endpoint, 'confirmed');
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  return new Program(limerIdl, provider);
}

/**
 * Create a read-only Anchor Program instance — no wallet required.
 * Safe to use in React Query hooks for account fetching (no signing ever needed).
 */
export async function getLimerProgramReadOnly(cluster = DEFAULT_CLUSTER) {
  const endpoint = CLUSTERS[cluster]?.rpc || CLUSTERS[DEFAULT_CLUSTER].rpc;
  const connection = new Connection(endpoint, 'confirmed');

  // Stub wallet — valid public key, no-op signing. Anchor requires a wallet shape
  // for AnchorProvider but never invokes sign methods for .account.x.fetch() calls.
  const readOnlyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  };

  const provider = new AnchorProvider(connection, readOnlyWallet, { commitment: 'confirmed' });
  return new Program(limerIdl, provider);
}

/**
 * Derive the UserProfile PDA for a given wallet.
 * Seeds: ["user", owner_pubkey]
 */
export function getUserProfilePDA(ownerPubkey) {
  const owner = ownerPubkey instanceof PublicKey ? ownerPubkey : new PublicKey(ownerPubkey);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('user'), owner.toBuffer()],
    getLimerProgramId()
  );
}

/**
 * Derive the TradeLog PDA for a given wallet.
 * Seeds: ["trades", owner_pubkey]
 */
export function getTradeLogPDA(ownerPubkey) {
  const owner = ownerPubkey instanceof PublicKey ? ownerPubkey : new PublicKey(ownerPubkey);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('trades'), owner.toBuffer()],
    getLimerProgramId()
  );
}
