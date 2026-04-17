/**
 * seed-faucet.ts
 * ─────────────────────────────────────────────────────────────────────
 * One-time setup for the mTTDC devnet faucet keypair. Performs:
 *   1. Transfer 0.1 SOL from founder → faucet (gas for future sends)
 *   2. Create faucet's ATA for mTTDC (founder pays rent)
 *   3. Transfer 50,000 mTTDC from founder's ATA → faucet's ATA
 *   4. Record result to src/solana/generated/faucet.json
 *
 * Idempotent: if faucet already has >= 50K mTTDC and >= 0.05 SOL, bails.
 *
 * Prerequisites:
 *   - Founder keypair at ~/.config/solana/id.json
 *   - Faucet keypair at ~/.config/solana/limer-faucet-devnet.json
 *     (generated via: solana-keygen new -o ~/.config/solana/limer-faucet-devnet.json)
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const RPC_URL = 'https://api.devnet.solana.com';
const FOUNDER_KP = path.join(os.homedir(), '.config/solana/id.json');
const FAUCET_KP = path.join(os.homedir(), '.config/solana/limer-faucet-devnet.json');
const MTTDC_RECORD = path.join(process.cwd(), 'src/solana/generated/mock-ttdc.json');
const FAUCET_RECORD = path.join(process.cwd(), 'src/solana/generated/faucet.json');

const SOL_TO_FUND_LAMPORTS = 100_000_000n;  // 0.1 SOL
const MTTDC_TO_SEED_HUMAN = 50_000n;         // 50K mTTDC

function loadKp(p: string): Keypair {
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(p, 'utf8'))));
}

async function main() {
  const founder = loadKp(FOUNDER_KP);
  const faucet = loadKp(FAUCET_KP);
  const mttdc = JSON.parse(fs.readFileSync(MTTDC_RECORD, 'utf8'));
  const mttdcMint = new PublicKey(mttdc.mint);
  const decimals = mttdc.decimals as number;
  const mttdcOnChain = MTTDC_TO_SEED_HUMAN * 10n ** BigInt(decimals);

  const connection = new Connection(RPC_URL, 'confirmed');

  console.log(`Founder      : ${founder.publicKey.toBase58()}`);
  console.log(`Faucet       : ${faucet.publicKey.toBase58()}`);
  console.log(`mTTDC mint   : ${mttdcMint.toBase58()}`);
  console.log('');

  // ── Check current state ──────────────────────────────────────────
  const faucetSol = await connection.getBalance(faucet.publicKey);
  const founderAta = await getAssociatedTokenAddress(mttdcMint, founder.publicKey);
  const faucetAta = await getAssociatedTokenAddress(mttdcMint, faucet.publicKey);
  let faucetMttdc = 0n;
  try {
    faucetMttdc = (await getAccount(connection, faucetAta)).amount;
  } catch {}

  console.log(`Faucet SOL   : ${(faucetSol / 1e9).toFixed(4)}`);
  console.log(`Faucet mTTDC : ${faucetMttdc} (raw); target: ${mttdcOnChain}`);
  console.log(`Founder ATA  : ${founderAta.toBase58()}`);
  console.log(`Faucet ATA   : ${faucetAta.toBase58()}`);
  console.log('');

  const needsSol = BigInt(faucetSol) < SOL_TO_FUND_LAMPORTS;
  const needsMttdc = faucetMttdc < mttdcOnChain;

  if (!needsSol && !needsMttdc) {
    console.log('✓ Faucet already seeded. Nothing to do.');
    writeRecord(faucet.publicKey.toBase58(), faucetAta.toBase58(), mttdcMint.toBase58(), null, null);
    return;
  }

  const tx = new Transaction();

  if (needsSol) {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: founder.publicKey,
        toPubkey: faucet.publicKey,
        lamports: Number(SOL_TO_FUND_LAMPORTS) - faucetSol,
      }),
    );
    console.log(`+ Transfer ${Number(SOL_TO_FUND_LAMPORTS) - faucetSol} lamports SOL`);
  }

  if (needsMttdc) {
    // Create faucet ATA if needed (idempotent)
    tx.add(
      createAssociatedTokenAccountIdempotentInstruction(
        founder.publicKey,  // payer
        faucetAta,
        faucet.publicKey,   // ATA owner
        mttdcMint,
        TOKEN_PROGRAM_ID,
      ),
    );
    const delta = mttdcOnChain - faucetMttdc;
    tx.add(
      createTransferInstruction(
        founderAta,
        faucetAta,
        founder.publicKey,
        delta,
        [],
        TOKEN_PROGRAM_ID,
      ),
    );
    console.log(`+ Transfer ${delta} raw mTTDC`);
  }

  const sig = await sendAndConfirmTransaction(connection, tx, [founder], {
    commitment: 'confirmed',
  });
  console.log(`✓ Seeded. Tx: ${sig}`);

  writeRecord(
    faucet.publicKey.toBase58(),
    faucetAta.toBase58(),
    mttdcMint.toBase58(),
    sig,
    new Date().toISOString(),
  );

  console.log('');
  console.log(`Solscan faucet: https://solscan.io/account/${faucet.publicKey.toBase58()}?cluster=devnet`);
  console.log(`Solscan ATA  : https://solscan.io/account/${faucetAta.toBase58()}?cluster=devnet`);
}

function writeRecord(
  faucetPubkey: string,
  faucetAta: string,
  mttdcMint: string,
  seedTxSig: string | null,
  seededAt: string | null,
) {
  fs.mkdirSync(path.dirname(FAUCET_RECORD), { recursive: true });
  const record = {
    purpose: 'mTTDC devnet faucet — distributes 10K mTTDC per claim per user',
    faucetPubkey,
    faucetAta,
    mttdcMint,
    seedTxSig,
    seededAt,
    claimAmountHuman: 10_000,
    claimAmountRaw: (10_000n * 10n ** 6n).toString(),
    initialFundingSol: Number(SOL_TO_FUND_LAMPORTS) / 1e9,
    initialMttdcHuman: Number(MTTDC_TO_SEED_HUMAN),
    network: 'devnet',
  };
  fs.writeFileSync(FAUCET_RECORD, JSON.stringify(record, null, 2));
  console.log(`✓ Recorded to ${FAUCET_RECORD}`);
}

main().catch((err) => {
  console.error('Seed faucet failed:', err);
  process.exit(1);
});
