/**
 * mint-ttdc-supply.ts
 * ─────────────────────────────────────────────────────────────────────
 * Mint initial supply for an existing Mock-TTDC mint whose metadata was
 * already attached via `mint-mock-ttdc.ts`. We use SPL-Token's `mintTo`
 * directly instead of mpl-token-metadata's `mintV1` because `mintV1`
 * throws IncorrectOwner (0x39) on plain Fungible mints when the ATA
 * doesn't already exist — the metadata program does not auto-create it.
 *
 * This script:
 *   1. Reads the mint address from src/solana/generated/mock-ttdc.json
 *   2. Derives the founder's associated token account (ATA), creating
 *      it if it doesn't exist (idempotent)
 *   3. Mints initialSupplyHuman * 10^decimals tokens to that ATA
 *   4. Updates mock-ttdc.json with the final mint-supply tx signature
 *
 * Idempotent: if the ATA already has at least the target supply, bails
 * without sending a transaction.
 */

import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const RPC_URL = 'https://api.devnet.solana.com';
const KEYPAIR_PATH = path.join(os.homedir(), '.config/solana/id.json');
const RECORD_PATH = path.join(process.cwd(), 'src/solana/generated/mock-ttdc.json');

if (!RPC_URL.includes('devnet')) {
  console.error('Refusing to run: RPC_URL is not devnet.');
  process.exit(1);
}

async function main() {
  if (!fs.existsSync(RECORD_PATH)) {
    console.error(`No mint record at ${RECORD_PATH}. Run mint-mock-ttdc.ts first.`);
    process.exit(1);
  }
  const record = JSON.parse(fs.readFileSync(RECORD_PATH, 'utf8'));
  const mintPubkey = new PublicKey(record.mint);
  const decimals = record.decimals as number;
  const supplyHuman = BigInt(record.initialSupplyHuman);
  const supplyOnChain = supplyHuman * 10n ** BigInt(decimals);

  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf8')));
  const founder = Keypair.fromSecretKey(secretKey);

  console.log(`Mint         : ${mintPubkey.toBase58()}`);
  console.log(`Founder      : ${founder.publicKey.toBase58()}`);
  console.log(`Target supply: ${supplyHuman} ${record.symbol} (on-chain: ${supplyOnChain})`);

  const connection = new Connection(RPC_URL, 'confirmed');

  const ata = await getAssociatedTokenAddress(
    mintPubkey,
    founder.publicKey,
    false,
    TOKEN_PROGRAM_ID,
  );
  console.log(`Founder ATA  : ${ata.toBase58()}`);

  // Idempotency: if the ATA already has >= target supply, bail.
  let existing = 0n;
  try {
    const acct = await getAccount(connection, ata);
    existing = acct.amount;
    console.log(`Existing balance: ${existing}`);
  } catch (_) {
    console.log('ATA does not exist yet — will be created.');
  }

  if (existing >= supplyOnChain) {
    console.log('ATA already at or above target supply. Nothing to do.');
    return;
  }

  const toMint = supplyOnChain - existing;
  console.log(`Minting delta: ${toMint}`);

  const tx = new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(
      founder.publicKey,
      ata,
      founder.publicKey,
      mintPubkey,
      TOKEN_PROGRAM_ID,
    ),
    createMintToInstruction(
      mintPubkey,
      ata,
      founder.publicKey,
      toMint,
      [],
      TOKEN_PROGRAM_ID,
    ),
  );

  const sig = await sendAndConfirmTransaction(connection, tx, [founder], {
    commitment: 'confirmed',
  });
  console.log(`✓ Supply minted. Tx: ${sig}`);

  // Update the record
  record.mintTxSig = sig;
  record.mintedAt = new Date().toISOString();
  fs.writeFileSync(RECORD_PATH, JSON.stringify(record, null, 2));
  console.log(`✓ Updated ${RECORD_PATH}`);

  console.log('');
  console.log(`Solscan: https://solscan.io/token/${mintPubkey.toBase58()}?cluster=devnet`);
  console.log(`View ATA: https://solscan.io/account/${ata.toBase58()}?cluster=devnet`);
}

main().catch((err) => {
  console.error('Supply mint failed:', err);
  process.exit(1);
});
