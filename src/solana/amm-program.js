import { Program, AnchorProvider } from '@anchor-lang/core';
import { Connection, PublicKey } from '@solana/web3.js';
import { CLUSTERS, DEFAULT_CLUSTER } from './config';

// Program ID for limer_amm — matches anchor/target/deploy/limer_amm-keypair.json
// and the declare_id! in anchor/programs/limer_amm/src/lib.rs.
const PROGRAM_ID_STRING = 'FVk7LzdZ976beSEJkdXD5ww1xRxpZpYjxodN9Kq1Bpwo';

let _programId = null;
let _idlWarned = false;

export function getLimerAmmProgramId() {
  if (!_programId) _programId = new PublicKey(PROGRAM_ID_STRING);
  return _programId;
}

/**
 * Create an Anchor Program instance for the limer_amm program with a
 * signing wallet. Use this for mutations (swap, deposit_liquidity, etc.).
 * Returns null if the IDL isn't yet importable (pre-build).
 */
export async function getLimerAmmProgram(wallet, cluster = DEFAULT_CLUSTER) {
  const endpoint = CLUSTERS[cluster]?.rpc || CLUSTERS[DEFAULT_CLUSTER].rpc;
  const connection = new Connection(endpoint, 'confirmed');
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

  try {
    const idlModule = await import('./idl/limer_amm.json');
    const idl = idlModule.default || idlModule;
    return new Program(idl, getLimerAmmProgramId(), provider);
  } catch {
    if (!_idlWarned) {
      console.warn('[limer_amm] IDL not found — AMM program client unavailable');
      _idlWarned = true;
    }
    return null;
  }
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

  try {
    const idlModule = await import('./idl/limer_amm.json');
    const idl = idlModule.default || idlModule;
    return new Program(idl, getLimerAmmProgramId(), provider);
  } catch {
    if (!_idlWarned) {
      console.warn('[limer_amm] IDL not found');
      _idlWarned = true;
    }
    return null;
  }
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
