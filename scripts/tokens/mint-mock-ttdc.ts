/**
 * mint-mock-ttdc.ts
 * ─────────────────────────────────────────────────────────────────────
 * Create the Mock TTDC (mTTDC) SPL Token on Solana devnet with Metaplex
 * Token Metadata so wallets (Solflare, Phantom, Backpack) display it
 * correctly alongside a name, symbol, and icon.
 *
 * Why Metaplex Token Metadata (not Token-2022 metadata extension)?
 *   - Wider wallet + DEX support as of 2026-04. Token-2022 metadata is
 *     the future, but Kamino/Jupiter/Solflare all reliably surface
 *     Metaplex-Token-Metadata mints today. Safer for the Superteam
 *     Kamino/DFlow/Solflare bounty.
 *
 * One-time use:
 *   ts-node scripts/tokens/mint-mock-ttdc.ts
 *
 * After success, the resulting mint address is printed and must be
 * committed to src/solana/tokens.ts so the frontend can reference it
 * by symbol. The mint is immutable once created — a second run of this
 * script creates a *different* mint.
 *
 * Audit trail: every mint creation is logged to docs/tokens-log.md.
 *
 * Safety:
 *   - Devnet only (script aborts if the configured Solana cluster is
 *     not devnet). Do NOT adapt this to mainnet without re-reviewing
 *     supply, freeze authority, and mint authority decisions.
 *   - Mint authority defaults to the founder's keypair (same as
 *     current limer program upgrade authority) for simplicity of
 *     devnet dev. In production this MUST be a Squads vault PDA.
 */

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  createSignerFromKeypair,
  generateSigner,
  percentAmount,
  signerIdentity,
  some,
} from '@metaplex-foundation/umi';
import {
  createFungible,
  mplTokenMetadata,
  mintV1,
  TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata';
import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// ── Config ────────────────────────────────────────────────────────────
const RPC_URL = 'https://api.devnet.solana.com';
const KEYPAIR_PATH = path.join(os.homedir(), '.config/solana/id.json');
const METADATA_URI = 'https://limerscapital.com/metadata/mttdc.json';
const TOKEN_NAME = 'Mock TTDC';
const TOKEN_SYMBOL = 'mTTDC';
const DECIMALS = 6;
// Initial supply: 1M mTTDC. Enough to seed AMM + test swaps + give to
// demo users. Multiply by 10^decimals for on-chain amount.
const INITIAL_SUPPLY_HUMAN = 1_000_000n;

// ── Abort guards ──────────────────────────────────────────────────────
if (!RPC_URL.includes('devnet')) {
  console.error('Refusing to run: RPC_URL is not devnet. This script is devnet-only.');
  process.exit(1);
}
if (!fs.existsSync(KEYPAIR_PATH)) {
  console.error(`Keypair not found at ${KEYPAIR_PATH}`);
  process.exit(1);
}

async function main() {
  const umi = createUmi(RPC_URL).use(mplTokenMetadata());

  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf8')));
  const founder = umi.eddsa.createKeypairFromSecretKey(secretKey);
  const founderSigner = createSignerFromKeypair(umi, founder);
  umi.use(signerIdentity(founderSigner));

  const balance = await umi.rpc.getBalance(founderSigner.publicKey);
  const balanceSol = Number(balance.basisPoints) / 1e9;
  console.log(`Founder      : ${founderSigner.publicKey}`);
  console.log(`Balance      : ${balanceSol.toFixed(4)} SOL (devnet)`);

  if (balanceSol < 0.05) {
    console.error('Balance too low to cover mint creation + metadata. Run `solana airdrop 1 --url devnet`.');
    process.exit(1);
  }

  // The mint is a fresh keypair. We generate it client-side so we can
  // commit its public key deterministically after creation.
  const mint = generateSigner(umi);
  console.log(`New mint     : ${mint.publicKey}`);
  console.log(`Name         : ${TOKEN_NAME}`);
  console.log(`Symbol       : ${TOKEN_SYMBOL}`);
  console.log(`Decimals     : ${DECIMALS}`);
  console.log(`Initial supply (human): ${INITIAL_SUPPLY_HUMAN}`);
  console.log(`Metadata URI : ${METADATA_URI}`);

  console.log('');
  console.log('Creating mint + metadata...');

  const createTx = await createFungible(umi, {
    mint,
    name: TOKEN_NAME,
    symbol: TOKEN_SYMBOL,
    uri: METADATA_URI,
    sellerFeeBasisPoints: percentAmount(0),
    decimals: some(DECIMALS),
    tokenStandard: TokenStandard.Fungible,
  })
    .add(setComputeUnitLimit(umi, { units: 400_000 }))
    .sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } });

  const createSig = Buffer.from(createTx.signature).toString('base64');
  console.log(`✓ Mint created. Tx (base64 sig): ${createSig}`);

  // Mint initial supply to the founder's associated token account.
  const initialSupplyOnChain = INITIAL_SUPPLY_HUMAN * 10n ** BigInt(DECIMALS);
  console.log(`Minting ${INITIAL_SUPPLY_HUMAN} ${TOKEN_SYMBOL} (raw: ${initialSupplyOnChain}) to founder...`);

  const mintTx = await mintV1(umi, {
    mint: mint.publicKey,
    authority: founderSigner,
    amount: initialSupplyOnChain,
    tokenOwner: founderSigner.publicKey,
    tokenStandard: TokenStandard.Fungible,
  })
    .add(setComputeUnitLimit(umi, { units: 400_000 }))
    .sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } });

  const mintSig = Buffer.from(mintTx.signature).toString('base64');
  console.log(`✓ Initial supply minted. Tx (base64 sig): ${mintSig}`);

  // Write a small record to disk so the frontend can pick up the address
  const outPath = path.join(process.cwd(), 'src/solana/generated/mock-ttdc.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const record = {
    symbol: TOKEN_SYMBOL,
    name: TOKEN_NAME,
    mint: mint.publicKey.toString(),
    decimals: DECIMALS,
    initialSupplyHuman: INITIAL_SUPPLY_HUMAN.toString(),
    metadataUri: METADATA_URI,
    network: 'devnet',
    mintAuthority: founderSigner.publicKey.toString(),
    createdAt: new Date().toISOString(),
    createTxSig: createSig,
    mintTxSig: mintSig,
  };
  fs.writeFileSync(outPath, JSON.stringify(record, null, 2));
  console.log(`✓ Recorded to ${outPath}`);

  console.log('');
  console.log('Next steps:');
  console.log(`  1. View in Solflare: https://solflare.com (devnet mode) → add token mint ${mint.publicKey}`);
  console.log(`  2. View on Solscan:  https://solscan.io/token/${mint.publicKey}?cluster=devnet`);
  console.log('  3. Append entry to docs/tokens-log.md');
  console.log('  4. Reference this mint in src/solana/tokens.ts so the UI can use it');
}

main().catch((err) => {
  console.error('Mint failed:', err);
  process.exit(1);
});
