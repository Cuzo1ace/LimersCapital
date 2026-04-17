/**
 * attach-lp-metadata.ts  (pre-staged — not runnable until Phase B3 upgrade)
 * ─────────────────────────────────────────────────────────────────────
 * Attaches Metaplex Token Metadata to each of the 6 LP mints via the
 * `create_lp_metadata` admin-gated instruction on the limer_amm program.
 *
 * BLOCKED until the program is upgraded with the new instruction. See
 * `anchor/programs/limer_amm/B3_LP_METADATA_DESIGN.md` for the upgrade
 * procedure. Running this script before that upgrade will fail with
 * "InstructionNotFound" because the IDL won't expose createLpMetadata.
 *
 * After the upgrade:
 *   1. Copy the new IDL: `cp anchor/target/idl/limer_amm.json src/solana/idl/`
 *   2. Run: `npx tsx scripts/amm/attach-lp-metadata.ts`
 *
 * Idempotent: any pool whose LP mint already has a metadata PDA is skipped.
 */

import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const RPC_URL = 'https://api.devnet.solana.com';
const KEYPAIR_PATH = path.join(os.homedir(), '.config/solana/id.json');
const IDL_PATH = path.join(process.cwd(), 'src/solana/idl/limer_amm.json');
const POOLS_RECORD = path.join(process.cwd(), 'src/solana/generated/amm-pools.json');

const MPL_TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
);

// Metadata plan — must match the JSONs at public/metadata/lp-*.json
const LP_METADATA_BY_PAIR: Record<
  string,
  { name: string; symbol: string; uriSlug: string }
> = {
  'mTTDC/mWCO':  { name: 'Limer LP mTTDC/mWCO',  symbol: 'LP-WCO',  uriSlug: 'lp-wco.json' },
  'mTTDC/mNEL':  { name: 'Limer LP mTTDC/mNEL',  symbol: 'LP-NEL',  uriSlug: 'lp-nel.json' },
  'mTTDC/mRFHL': { name: 'Limer LP mTTDC/mRFHL', symbol: 'LP-RFHL', uriSlug: 'lp-rfhl.json' },
  'mGKC/mTTDC':  { name: 'Limer LP mGKC/mTTDC',  symbol: 'LP-GKC',  uriSlug: 'lp-gkc.json' },
  'mTTDC/mNGL':  { name: 'Limer LP mTTDC/mNGL',  symbol: 'LP-NGL',  uriSlug: 'lp-ngl.json' },
  'wSOL/mTTDC':  { name: 'Limer LP wSOL/mTTDC',  symbol: 'LP-SOL',  uriSlug: 'lp-sol.json' },
};

function deriveMetadataPda(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    MPL_TOKEN_METADATA_PROGRAM_ID,
  );
  return pda;
}

async function main() {
  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf8')));
  const kp = Keypair.fromSecretKey(secretKey);
  const wallet = new Wallet(kp);
  const connection = new Connection(RPC_URL, 'confirmed');
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

  const idl = JSON.parse(fs.readFileSync(IDL_PATH, 'utf8'));
  const program = new Program(idl, provider);

  // Early abort if the program doesn't expose createLpMetadata
  const hasIx = (idl.instructions || []).some(
    (ix: any) => ix.name === 'createLpMetadata' || ix.name === 'create_lp_metadata',
  );
  if (!hasIx) {
    console.error(
      '✗ IDL does not expose `createLpMetadata`. Upgrade the program first per ' +
        'anchor/programs/limer_amm/B3_LP_METADATA_DESIGN.md, then re-copy the IDL ' +
        'to src/solana/idl/limer_amm.json.',
    );
    process.exit(1);
  }

  const pools = JSON.parse(fs.readFileSync(POOLS_RECORD, 'utf8')) as any[];
  const [ammConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from('amm_config')],
    program.programId,
  );

  for (const pool of pools) {
    const plan = LP_METADATA_BY_PAIR[pool.pairLabel];
    if (!plan) {
      console.log(`── ${pool.pairLabel}: no plan, skipping`);
      continue;
    }
    const lpMint = new PublicKey(pool.lpMint);
    const metadataPda = deriveMetadataPda(lpMint);
    const uri = `https://limerscapital.com/metadata/${plan.uriSlug}`;

    console.log(`── ${pool.pairLabel} ──`);
    console.log(`   lp mint      : ${lpMint.toBase58()}`);
    console.log(`   metadata pda : ${metadataPda.toBase58()}`);
    console.log(`   name/symbol  : ${plan.name} / ${plan.symbol}`);
    console.log(`   uri          : ${uri}`);

    // Idempotency: skip if metadata PDA already exists
    const existing = await connection.getAccountInfo(metadataPda);
    if (existing) {
      console.log('   ✓ already has metadata, skipping');
      pool.lpMetadataPda = metadataPda.toBase58();
      continue;
    }

    const sig = await program.methods
      .createLpMetadata(plan.name, plan.symbol, uri)
      .accounts({
        ammConfig,
        admin: kp.publicKey,
        pool: new PublicKey(pool.pool),
        poolAuthority: new PublicKey(pool.poolAuthority),
        lpMint,
        metadata: metadataPda,
        tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc({ commitment: 'confirmed' });
    console.log(`   ✓ tx: ${sig}`);

    pool.lpMetadataPda = metadataPda.toBase58();
    pool.lpMetadataTxSig = sig;
    pool.lpMetadataUri = uri;
    fs.writeFileSync(POOLS_RECORD, JSON.stringify(pools, null, 2));
  }

  console.log('\nDone. Verify in Solflare devnet — LP token balances should now show names.');
}

main().catch((err) => {
  console.error('attach-lp-metadata failed:', err);
  process.exit(1);
});
