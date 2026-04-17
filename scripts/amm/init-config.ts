/**
 * init-config.ts
 * ─────────────────────────────────────────────────────────────────────
 * Create the AmmConfig singleton for the limer_amm program. Run once,
 * immediately after `anchor deploy`. The caller becomes the admin and
 * gates future initialize_pool calls.
 *
 * Idempotent: if the AmmConfig PDA already exists, bails gracefully.
 */

import { AnchorProvider, BN, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const RPC_URL = 'https://api.devnet.solana.com';
const KEYPAIR_PATH = path.join(os.homedir(), '.config/solana/id.json');
const IDL_PATH = path.join(process.cwd(), 'src/solana/idl/limer_amm.json');
const DEFAULT_FEE_BPS = 30;  // 0.30% — Uniswap v2 convention

async function main() {
  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf8')));
  const kp = Keypair.fromSecretKey(secretKey);
  const wallet = new Wallet(kp);
  const connection = new Connection(RPC_URL, 'confirmed');
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

  const idl = JSON.parse(fs.readFileSync(IDL_PATH, 'utf8'));
  const program = new Program(idl, provider);
  const programId = program.programId;

  console.log(`Admin       : ${kp.publicKey.toBase58()}`);
  console.log(`Program ID  : ${programId.toBase58()}`);

  const [ammConfig, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('amm_config')],
    programId,
  );
  console.log(`AmmConfig   : ${ammConfig.toBase58()} (bump ${bump})`);

  // Idempotency check
  const existing = await connection.getAccountInfo(ammConfig);
  if (existing) {
    console.log('✓ AmmConfig already exists. Nothing to do.');
    return;
  }

  console.log('\nCreating AmmConfig...');
  const sig = await program.methods
    .initConfig(DEFAULT_FEE_BPS)
    .accounts({
      ammConfig,
      admin: kp.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc({ commitment: 'confirmed' });

  console.log(`✓ Tx: ${sig}`);
  console.log(`Solscan: https://solscan.io/tx/${sig}?cluster=devnet`);

  // Record
  const outPath = path.join(process.cwd(), 'src/solana/generated/amm-config.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        programId: programId.toBase58(),
        ammConfig: ammConfig.toBase58(),
        admin: kp.publicKey.toBase58(),
        defaultFeeBps: DEFAULT_FEE_BPS,
        initTxSig: sig,
        initializedAt: new Date().toISOString(),
        network: 'devnet',
      },
      null,
      2,
    ),
  );
  console.log(`✓ Recorded to ${outPath}`);
}

main().catch((err) => {
  console.error('init-config failed:', err);
  process.exit(1);
});
