/**
 * mint-mock-stocks.ts
 * ─────────────────────────────────────────────────────────────────────
 * Create the 5 tokenized mock TTSE stocks on devnet (mWCO, mNEL, mRFHL,
 * mGKC, mNGL). Each mint:
 *   - Metaplex Token Metadata attached via createFungible (Umi)
 *   - Freeze authority set to None from creation (Kamino composability)
 *   - 100,000 initial supply (100M base units at 6 decimals) minted to founder ATA
 *
 * This script uses the two-step pattern established in Phase A1:
 *   1. createFungible  — mint + metadata (Metaplex Umi)
 *   2. mintTo (SPL)    — supply, with idempotent ATA creation
 *
 * We do NOT use mpl-token-metadata's mintV1 because it throws
 * IncorrectOwner (0x39) on plain Fungible mints when the ATA does not
 * pre-exist. See docs/devnet-dev-notes.md.
 *
 * Run once:
 *   npx tsx scripts/tokens/mint-mock-stocks.ts
 *
 * Idempotent guard: if src/solana/generated/mock-stocks.json already
 * contains an entry for a ticker, that ticker is skipped. Re-run to
 * fill in tickers that failed previously.
 *
 * Output:
 *   - src/solana/generated/mock-stocks.json (array of 5 records)
 *   - Console log with Solscan URLs per stock
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
  TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata';
import { setComputeUnitLimit } from '@metaplex-foundation/mpl-toolbox';
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
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// ── Config ────────────────────────────────────────────────────────────
const RPC_URL = 'https://api.devnet.solana.com';
const KEYPAIR_PATH = path.join(os.homedir(), '.config/solana/id.json');
const RECORD_PATH = path.join(process.cwd(), 'src/solana/generated/mock-stocks.json');
const DECIMALS = 6;
const INITIAL_SUPPLY_HUMAN = 100_000n;

type StockConfig = {
  ticker: string;            // TTSE ticker, e.g. "NEL"
  symbol: string;            // on-chain symbol, e.g. "mNEL"
  name: string;              // full token name
  sector: string;
  refPriceTtd: string;
  metadataUri: string;
};

// mpl-token-metadata limits: name ≤ 32 chars, symbol ≤ 10 chars, uri ≤ 200.
// On-chain `name` is kept compact; full descriptive name lives in the
// metadata JSON at `uri` under the `name` field (no length limit there).
const STOCKS: StockConfig[] = [
  {
    ticker: 'WCO',
    symbol: 'mWCO',
    name: 'Mock WCO / W Indian Tobacco',       // 27 chars
    sector: 'Conglomerate',
    refPriceTtd: '2.41',
    metadataUri: 'https://limerscapital.com/metadata/mwco.json',
  },
  {
    ticker: 'NEL',
    symbol: 'mNEL',
    name: 'Mock NEL / Natl Enterprises',       // 27 chars
    sector: 'Energy',
    refPriceTtd: '3.70',
    metadataUri: 'https://limerscapital.com/metadata/mnel.json',
  },
  {
    ticker: 'RFHL',
    symbol: 'mRFHL',
    name: 'Mock RFHL / Republic Fin',          // 24 chars
    sector: 'Banking',
    refPriceTtd: '106.11',
    metadataUri: 'https://limerscapital.com/metadata/mrfhl.json',
  },
  {
    ticker: 'GKC',
    symbol: 'mGKC',
    name: 'Mock GKC / GraceKennedy',           // 23 chars
    sector: 'Conglomerate',
    refPriceTtd: '3.26',
    metadataUri: 'https://limerscapital.com/metadata/mgkc.json',
  },
  {
    ticker: 'NGL',
    symbol: 'mNGL',
    name: 'Mock NGL / TT NGL',                 // 17 chars
    sector: 'Energy',
    refPriceTtd: '9.10',
    metadataUri: 'https://limerscapital.com/metadata/mngl.json',
  },
];

// Sanity: enforce Metaplex Token Metadata length caps at startup so we
// never discover a NameTooLong / SymbolTooLong / UriTooLong error at IX
// simulation time. Same caps apply for any future additions.
for (const s of STOCKS) {
  if (s.name.length > 32) throw new Error(`${s.ticker}: name too long (${s.name.length} > 32): "${s.name}"`);
  if (s.symbol.length > 10) throw new Error(`${s.ticker}: symbol too long (${s.symbol.length} > 10): "${s.symbol}"`);
  if (s.metadataUri.length > 200) throw new Error(`${s.ticker}: uri too long (${s.metadataUri.length} > 200)`);
}

// ── Abort guards ──────────────────────────────────────────────────────
if (!RPC_URL.includes('devnet')) {
  console.error('Refusing to run: RPC_URL is not devnet.');
  process.exit(1);
}
if (!fs.existsSync(KEYPAIR_PATH)) {
  console.error(`Keypair not found at ${KEYPAIR_PATH}`);
  process.exit(1);
}

// ── Types for the record file ─────────────────────────────────────────
type MintRecord = {
  ticker: string;
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  initialSupplyHuman: string;
  metadataUri: string;
  network: 'devnet';
  mintAuthority: string;
  freezeAuthority: null;
  sector: string;
  refPriceTtd: string;
  createdAt: string;
  createTxSig: string;
  mintTxSig: string;
  founderAta: string;
};

function loadExistingRecords(): Record<string, MintRecord> {
  if (!fs.existsSync(RECORD_PATH)) return {};
  try {
    const raw = JSON.parse(fs.readFileSync(RECORD_PATH, 'utf8'));
    const byTicker: Record<string, MintRecord> = {};
    for (const r of raw as MintRecord[]) byTicker[r.ticker] = r;
    return byTicker;
  } catch {
    return {};
  }
}

function saveRecords(byTicker: Record<string, MintRecord>) {
  fs.mkdirSync(path.dirname(RECORD_PATH), { recursive: true });
  const asArray = STOCKS.map((s) => byTicker[s.ticker]).filter(Boolean);
  fs.writeFileSync(RECORD_PATH, JSON.stringify(asArray, null, 2));
}

async function main() {
  const existing = loadExistingRecords();

  // ── Umi setup (for createFungible) ─────────────────────────────────
  const umi = createUmi(RPC_URL).use(mplTokenMetadata());
  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf8')));
  const umiKp = umi.eddsa.createKeypairFromSecretKey(secretKey);
  const umiSigner = createSignerFromKeypair(umi, umiKp);
  umi.use(signerIdentity(umiSigner));

  // ── web3.js setup (for SPL mintTo) ─────────────────────────────────
  const connection = new Connection(RPC_URL, 'confirmed');
  const founder = Keypair.fromSecretKey(secretKey);

  const balance = await connection.getBalance(founder.publicKey);
  console.log(`Founder      : ${founder.publicKey.toBase58()}`);
  console.log(`Balance      : ${(balance / 1e9).toFixed(4)} SOL (devnet)`);
  console.log(`Stocks queue : ${STOCKS.map((s) => s.symbol).join(', ')}`);
  console.log('');

  if (balance < 0.1 * 1e9) {
    console.error('Balance too low. Run `solana airdrop 2 --url devnet`.');
    process.exit(1);
  }

  const supplyOnChain = INITIAL_SUPPLY_HUMAN * 10n ** BigInt(DECIMALS);

  for (const stock of STOCKS) {
    if (existing[stock.ticker]) {
      console.log(`── ${stock.symbol}: already minted (skipping) — mint ${existing[stock.ticker].mint}`);
      continue;
    }

    console.log(`── ${stock.symbol}: creating mint + metadata ──`);
    const mint = generateSigner(umi);
    const createTx = await createFungible(umi, {
      mint,
      name: stock.name,
      symbol: stock.symbol,
      uri: stock.metadataUri,
      sellerFeeBasisPoints: percentAmount(0),
      decimals: some(DECIMALS),
      tokenStandard: TokenStandard.Fungible,
      // Freeze authority = null (not set) from creation — Kamino composability.
      // The Umi helper defaults to the signer as mint/freeze; we want null freeze,
      // but mpl-token-metadata v3 does not expose a direct `freezeAuthority: null`
      // param on createFungible. We revoke immediately after in the same script.
    })
      .add(setComputeUnitLimit(umi, { units: 400_000 }))
      .sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } });
    const createSig = Buffer.from(createTx.signature).toString('base64');
    const mintPubkey = new PublicKey(mint.publicKey);
    console.log(`   mint       : ${mintPubkey.toBase58()}`);
    console.log(`   create sig : ${createSig}`);

    // Mint initial supply via SPL-Token direct (robust pattern)
    const ata = await getAssociatedTokenAddress(
      mintPubkey,
      founder.publicKey,
      false,
      TOKEN_PROGRAM_ID,
    );
    const mintTx = new Transaction().add(
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
        supplyOnChain,
        [],
        TOKEN_PROGRAM_ID,
      ),
    );
    const mintSig = await sendAndConfirmTransaction(connection, mintTx, [founder], {
      commitment: 'confirmed',
    });
    console.log(`   ata        : ${ata.toBase58()}`);
    console.log(`   mintTo sig : ${mintSig}`);

    // Revoke freeze authority (set to None) — one-way, Kamino composability.
    // Using web3.js's spl-token directly because mpl-token-metadata does not
    // expose a clean way to nullify freeze on creation; post-facto revoke is
    // equivalent in outcome.
    const { createSetAuthorityInstruction, AuthorityType } = await import('@solana/spl-token');
    const revokeFreezeTx = new Transaction().add(
      createSetAuthorityInstruction(
        mintPubkey,
        founder.publicKey,
        AuthorityType.FreezeAccount,
        null,
        [],
        TOKEN_PROGRAM_ID,
      ),
    );
    const freezeSig = await sendAndConfirmTransaction(connection, revokeFreezeTx, [founder], {
      commitment: 'confirmed',
    });
    console.log(`   freeze→None: ${freezeSig}`);

    const record: MintRecord = {
      ticker: stock.ticker,
      symbol: stock.symbol,
      name: stock.name,
      mint: mintPubkey.toBase58(),
      decimals: DECIMALS,
      initialSupplyHuman: INITIAL_SUPPLY_HUMAN.toString(),
      metadataUri: stock.metadataUri,
      network: 'devnet',
      mintAuthority: founder.publicKey.toBase58(),
      freezeAuthority: null,
      sector: stock.sector,
      refPriceTtd: stock.refPriceTtd,
      createdAt: new Date().toISOString(),
      createTxSig: createSig,
      mintTxSig: mintSig,
      founderAta: ata.toBase58(),
    };
    existing[stock.ticker] = record;
    saveRecords(existing);
    console.log(`   ✓ ${stock.symbol} recorded`);
    console.log(`   Solscan: https://solscan.io/token/${mintPubkey.toBase58()}?cluster=devnet`);
    console.log('');
  }

  console.log('── Summary ──');
  for (const s of STOCKS) {
    const r = existing[s.ticker];
    if (r) {
      console.log(`  ${s.symbol.padEnd(7)} ${r.mint}`);
    } else {
      console.log(`  ${s.symbol.padEnd(7)} (NOT MINTED)`);
    }
  }
  console.log('');
  console.log(`Record file: ${RECORD_PATH}`);
  console.log('Next: add entries to src/solana/tokens.js and docs/tokens-log.md');
}

main().catch((err) => {
  console.error('Mint batch failed:', err);
  process.exit(1);
});
