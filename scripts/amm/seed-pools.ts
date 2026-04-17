/**
 * seed-pools.ts
 * ─────────────────────────────────────────────────────────────────────
 * Deposit initial liquidity into all 6 pools. Per-pool amounts are set
 * by reference-price ratios so the AMM-implied price matches the real
 * TTSE quote at creation time. Documented in docs/tokens-log.md.
 *
 * Seeding plan (mStock × 20,000 shares, mTTDC side = shares × ref_ttd):
 *   mTTDC/mWCO    : 48,200 mTTDC  +  20,000 mWCO   (implied 2.41 per share)
 *   mTTDC/mNEL    : 74,000 mTTDC  +  20,000 mNEL   (implied 3.70)
 *   mTTDC/mRFHL   : 2,122,200 mTTDC + 20,000 mRFHL (implied 106.11)
 *   mGKC/mTTDC    : 20,000 mGKC   +  65,200 mTTDC  (implied 3.26; A/B inverted)
 *   mTTDC/mNGL    : 182,000 mTTDC +  20,000 mNGL   (implied 9.10)
 *   wSOL/mTTDC    : 0.5 SOL + 611 mTTDC           (bridge; 1 SOL ≈ $180 ≈ 1222 mTTDC)
 *
 * Total mTTDC consumed:   2,491,600 mTTDC (out of 4.95M available after faucet)
 * Total mStocks consumed: 20,000 each (out of 100K) = 20% of supply per stock
 * Total SOL consumed:     0.5 SOL (wrapped to wSOL for the bridge pool)
 *
 * Idempotent: if a pool's vaults already contain at least the target
 * amount on both sides, that pool is skipped.
 */

import { AnchorProvider, BN, Program, Wallet } from '@coral-xyz/anchor';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createSyncNativeInstruction,
  getAccount,
  getAssociatedTokenAddress,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const RPC_URL = 'https://api.devnet.solana.com';
const KEYPAIR_PATH = path.join(os.homedir(), '.config/solana/id.json');
const IDL_PATH = path.join(process.cwd(), 'src/solana/idl/limer_amm.json');
const POOLS_RECORD = path.join(process.cwd(), 'src/solana/generated/amm-pools.json');

/** Token decimals — read from token records. For wSOL we hardcode 9. */
const DECIMALS: Record<string, number> = {
  mTTDC: 6,
  mWCO: 6,
  mNEL: 6,
  mRFHL: 6,
  mGKC: 6,
  mNGL: 6,
  wSOL: 9,
};

/**
 * Per-pool seed amounts in HUMAN units. Reference prices match
 * src/api/ttse.js TTSE_FALLBACK snapshot (24 Mar 2026). The bridge pool
 * is separately scaled so ~0.1% slippage on a 0.01 SOL swap is typical.
 */
type SeedPlan = {
  pairLabel: string;
  mTTDCHuman: number;
  mStockHuman: number;
  mStockSymbol: string;  // informational
  wSOLHuman?: number;    // for bridge pool only
};

const SEED_PLANS: Record<string, SeedPlan> = {
  'mTTDC/mWCO':  { pairLabel: 'mTTDC/mWCO',  mTTDCHuman: 48_200,    mStockHuman: 20_000, mStockSymbol: 'mWCO' },
  'mTTDC/mNEL':  { pairLabel: 'mTTDC/mNEL',  mTTDCHuman: 74_000,    mStockHuman: 20_000, mStockSymbol: 'mNEL' },
  'mTTDC/mRFHL': { pairLabel: 'mTTDC/mRFHL', mTTDCHuman: 2_122_200, mStockHuman: 20_000, mStockSymbol: 'mRFHL' },
  'mGKC/mTTDC':  { pairLabel: 'mGKC/mTTDC',  mTTDCHuman: 65_200,    mStockHuman: 20_000, mStockSymbol: 'mGKC' },
  'mTTDC/mNGL':  { pairLabel: 'mTTDC/mNGL',  mTTDCHuman: 182_000,   mStockHuman: 20_000, mStockSymbol: 'mNGL' },
  'wSOL/mTTDC':  { pairLabel: 'wSOL/mTTDC',  mTTDCHuman: 611,       mStockHuman: 0,      mStockSymbol: 'N/A', wSOLHuman: 0.5 },
};

function toRaw(human: number, decimals: number): bigint {
  return BigInt(Math.round(human * 10 ** decimals));
}

async function ensureWsolAta(
  connection: Connection,
  founder: Keypair,
  amountLamports: bigint,
): Promise<PublicKey> {
  const ata = await getAssociatedTokenAddress(NATIVE_MINT, founder.publicKey);
  const tx = new Transaction();
  tx.add(
    createAssociatedTokenAccountIdempotentInstruction(
      founder.publicKey,
      ata,
      founder.publicKey,
      NATIVE_MINT,
      TOKEN_PROGRAM_ID,
    ),
    SystemProgram.transfer({
      fromPubkey: founder.publicKey,
      toPubkey: ata,
      lamports: Number(amountLamports),
    }),
    createSyncNativeInstruction(ata, TOKEN_PROGRAM_ID),
  );
  await connection.sendTransaction(tx, [founder], { preflightCommitment: 'confirmed' });
  // wait for confirmation via a balance fetch retry
  for (let i = 0; i < 10; i++) {
    try {
      const acct = await getAccount(connection, ata);
      if (acct.amount >= amountLamports) return ata;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return ata;
}

async function main() {
  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf8')));
  const kp = Keypair.fromSecretKey(secretKey);
  const wallet = new Wallet(kp);
  const connection = new Connection(RPC_URL, 'confirmed');
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

  const idl = JSON.parse(fs.readFileSync(IDL_PATH, 'utf8'));
  const program = new Program(idl, provider);

  const pools = JSON.parse(fs.readFileSync(POOLS_RECORD, 'utf8')) as any[];

  for (const pool of pools) {
    const plan = SEED_PLANS[pool.pairLabel];
    if (!plan) {
      console.log(`── ${pool.pairLabel}: no seed plan, skipping`);
      continue;
    }

    console.log(`── ${pool.pairLabel} ──`);

    // Check on-chain vault balances for idempotency
    const vaultA = new PublicKey(pool.tokenAVault);
    const vaultB = new PublicKey(pool.tokenBVault);
    let balA = 0n;
    let balB = 0n;
    try {
      balA = (await getAccount(connection, vaultA)).amount;
      balB = (await getAccount(connection, vaultB)).amount;
    } catch {}

    // Determine expected amounts for A and B given canonical order
    let expectedA: bigint;
    let expectedB: bigint;
    const isBridge = !!plan.wSOLHuman;

    if (isBridge) {
      // Pool order is wSOL/mTTDC (A=wSOL, B=mTTDC on-chain per init-pools output)
      if (pool.aSymbol === 'wSOL') {
        expectedA = toRaw(plan.wSOLHuman!, DECIMALS.wSOL);
        expectedB = toRaw(plan.mTTDCHuman, DECIMALS.mTTDC);
      } else {
        expectedA = toRaw(plan.mTTDCHuman, DECIMALS.mTTDC);
        expectedB = toRaw(plan.wSOLHuman!, DECIMALS.wSOL);
      }
    } else {
      if (pool.aSymbol === 'mTTDC') {
        expectedA = toRaw(plan.mTTDCHuman, DECIMALS.mTTDC);
        expectedB = toRaw(plan.mStockHuman, DECIMALS.mTTDC);
      } else {
        // inverted: e.g. mGKC/mTTDC
        expectedA = toRaw(plan.mStockHuman, DECIMALS.mTTDC);
        expectedB = toRaw(plan.mTTDCHuman, DECIMALS.mTTDC);
      }
    }

    if (balA >= expectedA && balB >= expectedB) {
      console.log(`   ✓ already seeded (balA=${balA}, balB=${balB})`);
      continue;
    }

    console.log(`   need A=${expectedA} B=${expectedB} (have A=${balA} B=${balB})`);

    // Depositor's source ATAs
    const mintA = new PublicKey(pool.mintA);
    const mintB = new PublicKey(pool.mintB);

    let depositorA: PublicKey;
    let depositorB: PublicKey;

    if (isBridge) {
      const wsolSide = pool.aSymbol === 'wSOL' ? 'A' : 'B';
      const wsolAmount = wsolSide === 'A' ? expectedA : expectedB;
      console.log(`   wrapping ${Number(wsolAmount) / 1e9} SOL → wSOL`);
      const wsolAta = await ensureWsolAta(connection, kp, wsolAmount);
      if (wsolSide === 'A') {
        depositorA = wsolAta;
        depositorB = await getAssociatedTokenAddress(mintB, kp.publicKey);
      } else {
        depositorA = await getAssociatedTokenAddress(mintA, kp.publicKey);
        depositorB = wsolAta;
      }
    } else {
      depositorA = await getAssociatedTokenAddress(mintA, kp.publicKey);
      depositorB = await getAssociatedTokenAddress(mintB, kp.publicKey);
    }

    // LP ATA for depositor — create idempotently
    const lpMint = new PublicKey(pool.lpMint);
    const depositorLp = await getAssociatedTokenAddress(lpMint, kp.publicKey);
    const lpAtaIxTx = new Transaction().add(
      createAssociatedTokenAccountIdempotentInstruction(
        kp.publicKey,
        depositorLp,
        kp.publicKey,
        lpMint,
        TOKEN_PROGRAM_ID,
      ),
    );
    await connection.sendTransaction(lpAtaIxTx, [kp]);
    // Small settle
    await new Promise((r) => setTimeout(r, 1500));

    const sig = await program.methods
      .depositLiquidity(new BN(expectedA.toString()), new BN(expectedB.toString()), new BN(0))
      .accounts({
        pool: new PublicKey(pool.pool),
        poolAuthority: new PublicKey(pool.poolAuthority),
        tokenAVault: vaultA,
        tokenBVault: vaultB,
        lpMint,
        depositorTokenA: depositorA,
        depositorTokenB: depositorB,
        depositorLp,
        depositor: kp.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: 'confirmed' });

    console.log(`   ✓ seeded: ${sig}`);
    pool.seedTxSig = sig;
    pool.seededAt = new Date().toISOString();
    pool.initialLiquidity = {
      amountA: expectedA.toString(),
      amountB: expectedB.toString(),
    };
    fs.writeFileSync(POOLS_RECORD, JSON.stringify(pools, null, 2));
  }

  console.log('\n── Summary ──');
  for (const pool of pools) {
    if (pool.seedTxSig) {
      console.log(`  ${pool.pairLabel.padEnd(14)} seeded — ${pool.seedTxSig.slice(0, 16)}…`);
    } else {
      console.log(`  ${pool.pairLabel.padEnd(14)} (not seeded)`);
    }
  }
}

main().catch((err) => {
  console.error('seed-pools failed:', err);
  process.exit(1);
});
