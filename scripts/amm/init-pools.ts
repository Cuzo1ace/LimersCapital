/**
 * init-pools.ts
 * ─────────────────────────────────────────────────────────────────────
 * Initialize all 6 pools on the limer_amm program (phase B4, per DESIGN.md).
 *
 * Pools:
 *   - mWCO  / mTTDC
 *   - mNEL  / mTTDC
 *   - mRFHL / mTTDC
 *   - mGKC  / mTTDC
 *   - mNGL  / mTTDC
 *   - mTTDC / wSOL  (bridge pool)
 *
 * Mint canonical order is enforced on-chain via Pool seeds
 * `[b"pool", token_a_mint, token_b_mint]` where `token_a_mint < token_b_mint`.
 * We sort lexicographically here so the PDA derivation matches.
 *
 * Idempotent: if a pool PDA already exists, it is skipped.
 * Output: src/solana/generated/amm-pools.json — array of pool records.
 */

import { AnchorProvider, BN, Program, Wallet } from '@coral-xyz/anchor';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from '@solana/web3.js';
import {
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const RPC_URL = 'https://api.devnet.solana.com';
const KEYPAIR_PATH = path.join(os.homedir(), '.config/solana/id.json');
const IDL_PATH = path.join(process.cwd(), 'src/solana/idl/limer_amm.json');
const AMM_CONFIG_RECORD = path.join(process.cwd(), 'src/solana/generated/amm-config.json');
const MTTDC_RECORD = path.join(process.cwd(), 'src/solana/generated/mock-ttdc.json');
const STOCKS_RECORD = path.join(process.cwd(), 'src/solana/generated/mock-stocks.json');
const OUT_RECORD = path.join(process.cwd(), 'src/solana/generated/amm-pools.json');
const FEE_BPS = 30;

type PoolPlan = {
  pairLabel: string;     // human-readable: "mWCO/mTTDC"
  mintA: PublicKey;      // canonical smaller pubkey
  mintB: PublicKey;      // canonical larger pubkey
  aSymbol: string;
  bSymbol: string;
};

function sortMints(m1: PublicKey, m1Sym: string, m2: PublicKey, m2Sym: string): PoolPlan {
  const cmp = Buffer.compare(m1.toBuffer(), m2.toBuffer());
  if (cmp < 0) {
    return { pairLabel: `${m1Sym}/${m2Sym}`, mintA: m1, mintB: m2, aSymbol: m1Sym, bSymbol: m2Sym };
  }
  return { pairLabel: `${m2Sym}/${m1Sym}`, mintA: m2, mintB: m1, aSymbol: m2Sym, bSymbol: m1Sym };
}

async function main() {
  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf8')));
  const kp = Keypair.fromSecretKey(secretKey);
  const wallet = new Wallet(kp);
  const connection = new Connection(RPC_URL, 'confirmed');
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

  const idl = JSON.parse(fs.readFileSync(IDL_PATH, 'utf8'));
  const program = new Program(idl, provider);
  const programId = program.programId;

  const ammConfigRecord = JSON.parse(fs.readFileSync(AMM_CONFIG_RECORD, 'utf8'));
  const ammConfig = new PublicKey(ammConfigRecord.ammConfig);

  const mttdcRecord = JSON.parse(fs.readFileSync(MTTDC_RECORD, 'utf8'));
  const mTTDC = new PublicKey(mttdcRecord.mint);
  const stocksRecord = JSON.parse(fs.readFileSync(STOCKS_RECORD, 'utf8'));

  console.log(`Admin       : ${kp.publicKey.toBase58()}`);
  console.log(`Program ID  : ${programId.toBase58()}`);
  console.log(`AmmConfig   : ${ammConfig.toBase58()}`);
  console.log(`mTTDC mint  : ${mTTDC.toBase58()}`);
  console.log(`wSOL mint   : ${NATIVE_MINT.toBase58()}`);
  console.log('');

  // ── Build the plan: 5 mStock/mTTDC pools + 1 mTTDC/wSOL bridge ────
  const plans: (PoolPlan & { refPriceTtd?: string; ticker?: string; isBridge?: boolean })[] = [];
  for (const stock of stocksRecord) {
    const p = sortMints(new PublicKey(stock.mint), stock.symbol, mTTDC, 'mTTDC');
    plans.push({ ...p, refPriceTtd: stock.refPriceTtd, ticker: stock.ticker });
  }
  // Bridge pool
  plans.push({ ...sortMints(mTTDC, 'mTTDC', NATIVE_MINT, 'wSOL'), isBridge: true });

  // ── Load existing records (for idempotency) ───────────────────────
  let existing: any[] = [];
  if (fs.existsSync(OUT_RECORD)) {
    try {
      existing = JSON.parse(fs.readFileSync(OUT_RECORD, 'utf8'));
    } catch {}
  }
  const byLabel: Record<string, any> = {};
  for (const r of existing) byLabel[r.pairLabel] = r;

  for (const plan of plans) {
    console.log(`── ${plan.pairLabel} (A=${plan.aSymbol} B=${plan.bSymbol}) ──`);

    const [pool, poolBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('pool'), plan.mintA.toBuffer(), plan.mintB.toBuffer()],
      programId,
    );
    const [poolAuthority, authBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('authority'), pool.toBuffer()],
      programId,
    );
    const [lpMint, lpBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('lp_mint'), pool.toBuffer()],
      programId,
    );

    console.log(`   pool       : ${pool.toBase58()}`);
    console.log(`   authority  : ${poolAuthority.toBase58()}`);
    console.log(`   lp mint    : ${lpMint.toBase58()}`);

    const existsOnChain = await connection.getAccountInfo(pool);
    if (existsOnChain) {
      console.log(`   ✓ already exists, skipping`);
      if (!byLabel[plan.pairLabel]) {
        // Backfill the record even if on-chain exists
        byLabel[plan.pairLabel] = {
          pairLabel: plan.pairLabel,
          mintA: plan.mintA.toBase58(),
          mintB: plan.mintB.toBase58(),
          aSymbol: plan.aSymbol,
          bSymbol: plan.bSymbol,
          pool: pool.toBase58(),
          poolAuthority: poolAuthority.toBase58(),
          lpMint: lpMint.toBase58(),
          refPriceTtd: plan.refPriceTtd || null,
          ticker: plan.ticker || null,
          isBridge: !!plan.isBridge,
          feeBps: FEE_BPS,
          initTxSig: 'pre-existing',
          initializedAt: new Date().toISOString(),
        };
      }
      continue;
    }

    // Fresh vault keypairs (ATAs here aren't an option because the LP mint
    // is a PDA and ATA derivation is only defined for externally-owned
    // mints. So vaults are plain token accounts at fresh keypairs, with
    // pool_authority as their owner.)
    const tokenAVault = Keypair.generate();
    const tokenBVault = Keypair.generate();
    console.log(`   vault A    : ${tokenAVault.publicKey.toBase58()}`);
    console.log(`   vault B    : ${tokenBVault.publicKey.toBase58()}`);

    const sig = await program.methods
      .initializePool(FEE_BPS)
      .accounts({
        ammConfig,
        admin: kp.publicKey,
        tokenAMint: plan.mintA,
        tokenBMint: plan.mintB,
        pool,
        poolAuthority,
        tokenAVault: tokenAVault.publicKey,
        tokenBVault: tokenBVault.publicKey,
        lpMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([tokenAVault, tokenBVault])
      .rpc({ commitment: 'confirmed' });

    console.log(`   ✓ tx: ${sig}`);

    byLabel[plan.pairLabel] = {
      pairLabel: plan.pairLabel,
      mintA: plan.mintA.toBase58(),
      mintB: plan.mintB.toBase58(),
      aSymbol: plan.aSymbol,
      bSymbol: plan.bSymbol,
      pool: pool.toBase58(),
      poolAuthority: poolAuthority.toBase58(),
      tokenAVault: tokenAVault.publicKey.toBase58(),
      tokenBVault: tokenBVault.publicKey.toBase58(),
      lpMint: lpMint.toBase58(),
      refPriceTtd: plan.refPriceTtd || null,
      ticker: plan.ticker || null,
      isBridge: !!plan.isBridge,
      feeBps: FEE_BPS,
      initTxSig: sig,
      initializedAt: new Date().toISOString(),
    };
    // Persist incrementally so we don't lose state mid-run
    fs.writeFileSync(OUT_RECORD, JSON.stringify(Object.values(byLabel), null, 2));
  }

  console.log('');
  console.log('── Summary ──');
  for (const r of Object.values(byLabel) as any[]) {
    console.log(`  ${r.pairLabel.padEnd(14)} ${r.pool}`);
  }
}

main().catch((err) => {
  console.error('init-pools failed:', err);
  process.exit(1);
});
