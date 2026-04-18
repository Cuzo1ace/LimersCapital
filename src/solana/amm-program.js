import { Program, AnchorProvider } from '@anchor-lang/core';
import { Connection, PublicKey } from '@solana/web3.js';
import { CLUSTERS, DEFAULT_CLUSTER } from './config';
// Static import — dynamic `await import('./idl/limer_amm.json')` was flaky
// in Vite production builds (JSON chunk wasn't always emitted, causing
// runtime 404s and the user-visible "limer_amm program client unavailable"
// error on the deployed site). IDL is ~22 KB; bundle size impact is
// negligible vs. the reliability gain.
import limerAmmIdl from './idl/limer_amm.json';

// Program ID for limer_amm — matches anchor/target/deploy/limer_amm-keypair.json
// and the declare_id! in anchor/programs/limer_amm/src/lib.rs.
const PROGRAM_ID_STRING = 'FVk7LzdZ976beSEJkdXD5ww1xRxpZpYjxodN9Kq1Bpwo';

let _programId = null;

export function getLimerAmmProgramId() {
  if (!_programId) _programId = new PublicKey(PROGRAM_ID_STRING);
  return _programId;
}

/**
 * Create an Anchor Program instance for the limer_amm program with a
 * signing wallet. Use this for mutations (swap, deposit_liquidity, etc.).
 *
 * CONSTRUCTOR SIGNATURE: @anchor-lang/core@1.0.0 uses `(idl, provider, coder?)`
 * — NOT the legacy @coral-xyz/anchor `(idl, programId, provider)` shape.
 * The program ID is read from `idl.address` (Anchor writes it there during
 * `anchor build`). Passing a PublicKey in the provider slot causes the
 * AnchorProvider to land in the coder slot, then during AccountClient
 * construction Anchor does `coder.accounts.size(name)` on what it thinks
 * is a coder but is actually a provider → `undefined.size` throws. That
 * was the root cause of the "Cannot read properties of undefined (reading
 * 'size')" error the user was seeing on every swap click. See the agent's
 * investigation report 2026-04-17.
 *
 * Async signature preserved for call-site compatibility; the IDL is now
 * statically imported so there is no await-worthy work here, but
 * downstream callers already use `await getLimerAmmProgram(...)`.
 */
export async function getLimerAmmProgram(wallet, cluster = DEFAULT_CLUSTER) {
  const endpoint = CLUSTERS[cluster]?.rpc || CLUSTERS[DEFAULT_CLUSTER].rpc;
  const connection = new Connection(endpoint, 'confirmed');
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  return new Program(limerAmmIdl, provider);
}

/**
 * Read-only Program instance — for account fetches + quote computation.
 * No wallet required. Stub wallet used only because Anchor mandates one.
 */
export async function getLimerAmmProgramReadOnly(cluster = DEFAULT_CLUSTER) {
  const endpoint = CLUSTERS[cluster]?.rpc || CLUSTERS[DEFAULT_CLUSTER].rpc;
  const connection = new Connection(endpoint, 'confirmed');
  const readOnlyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  };
  const provider = new AnchorProvider(connection, readOnlyWallet, { commitment: 'confirmed' });
  return new Program(limerAmmIdl, provider);
}

// ── PDA derivation helpers ───────────────────────────────────────────

/** `[b"amm_config"]` — the global singleton. */
export function getAmmConfigPDA() {
  return PublicKey.findProgramAddressSync([Buffer.from('amm_config')], getLimerAmmProgramId());
}

/**
 * `[b"pool", token_a, token_b]` — where `token_a < token_b` canonically.
 * Returns the PDA, bump, and the canonical ordering so callers know
 * which of their input mints ended up as A vs B.
 */
export function getPoolPDA(mintX, mintY) {
  const a = mintX instanceof PublicKey ? mintX : new PublicKey(mintX);
  const b = mintY instanceof PublicKey ? mintY : new PublicKey(mintY);
  const cmp = Buffer.compare(a.toBuffer(), b.toBuffer());
  const [mintA, mintB] = cmp < 0 ? [a, b] : [b, a];
  const [pool, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), mintA.toBuffer(), mintB.toBuffer()],
    getLimerAmmProgramId(),
  );
  return { pool, bump, mintA, mintB };
}

/** `[b"authority", pool]` — signer PDA for vault transfers + LP mint. */
export function getPoolAuthorityPDA(pool) {
  const p = pool instanceof PublicKey ? pool : new PublicKey(pool);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('authority'), p.toBuffer()],
    getLimerAmmProgramId(),
  );
}

/** `[b"lp_mint", pool]`. */
export function getLpMintPDA(pool) {
  const p = pool instanceof PublicKey ? pool : new PublicKey(pool);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('lp_mint'), p.toBuffer()],
    getLimerAmmProgramId(),
  );
}
