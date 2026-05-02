/**
 * juice_escrow client — Sprint 2.
 *
 * Builds web3.js TransactionInstructions for the four juice_escrow
 * instructions. Self-contained (no @coral-xyz/anchor runtime needed) so
 * it slots straight into SendPanel's existing wallet-standard sign+send
 * flow. Anchor's IDL-derived clients work fine; the hand-rolled approach
 * here is explicit and matches how `accounts.js`'s SPL transfer builder
 * is structured.
 *
 * Until `JUICE_ESCROW_LIVE = true` (post-deploy), the four high-level
 * helpers (`initializeSavings` etc.) throw immediately so any UI code
 * calling them gets a clear "Sprint 2 not deployed yet" error. PDA
 * derivation works regardless and is safe to call.
 *
 * Deploy checklist before flipping the live flag:
 *   1. `cd anchor && anchor build` — generates target/deploy keypair
 *   2. `anchor keys list` → copy the juice_escrow pubkey
 *   3. Update declare_id! in lib.rs AND [programs.devnet] in Anchor.toml
 *   4. Update JUICE_ESCROW_PROGRAM_ID below to that same pubkey
 *   5. `anchor deploy --provider.cluster devnet`
 *   6. Set JUICE_ESCROW_LIVE = true and ship
 */

import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { TOKEN_PROGRAMS } from '../stablecoins.js';

// 🚧 Replace with the on-chain program ID after `anchor keys list`.
export const JUICE_ESCROW_PROGRAM_ID = new PublicKey('JEscrowJ11111111111111111111111111111111111');

/** Set to true once the on-chain program is deployed and matches the PDA seeds below. */
export const JUICE_ESCROW_LIVE = false;

/** Frozen seed strings — must match anchor/programs/juice_escrow/src/lib.rs. */
export const SEEDS = {
  savings:      Buffer.from('juice-savings'),
  savingsVault: Buffer.from('juice-savings-vault'),
};

const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// ── PDA derivation (always available, even pre-deploy) ────────────────

export function deriveSavingsPda(assetAddress) {
  const asset = toPk(assetAddress);
  return PublicKey.findProgramAddressSync(
    [SEEDS.savings, asset.toBuffer()],
    JUICE_ESCROW_PROGRAM_ID,
  );
}

export function deriveSavingsVault(assetAddress) {
  const asset = toPk(assetAddress);
  return PublicKey.findProgramAddressSync(
    [SEEDS.savingsVault, asset.toBuffer()],
    JUICE_ESCROW_PROGRAM_ID,
  );
}

// ── Anchor instruction discriminators (sha256("global:<name>")[..8]) ──
//
// Hard-coded so we don't pull in a full Anchor JS SDK. Compute via:
//   crypto.createHash('sha256').update('global:initialize_savings').digest().slice(0, 8)
// If you rename an instruction, update both lib.rs AND the constant here.

const DISCRIMINATORS = {
  initialize_savings: Buffer.from([124,  88, 159, 145,  39, 191,  35, 215]),
  deposit:            Buffer.from([242,  35, 198, 137,  82, 225, 242, 182]),
  claim:              Buffer.from([ 62, 198, 214, 193, 213, 159, 108, 210]),
  cancel:             Buffer.from([232, 219, 223, 41, 219, 236, 220, 190]),
};
//
// ⚠ These discriminators are PLACEHOLDERS computed offline. Verify against
// `anchor build`'s generated IDL JSON before going live — Anchor recomputes
// these from the instruction name on each compile and they DO change if you
// rename. Mismatch = `Error: 0x67` invalid instruction at runtime.

// ── High-level instruction builders ───────────────────────────────────

/**
 * Initialize a new savings escrow. Returns a single web3.js
 * TransactionInstruction ready to drop into the existing transfer tx.
 *
 * @param {object} args
 * @param {PublicKey|string} args.creator
 * @param {PublicKey|string} args.asset                — Metaplex Core asset (already minted)
 * @param {PublicKey|string} args.recipient            — receipt owner (for indexing)
 * @param {PublicKey|string} args.mint
 * @param {PublicKey|string} args.creatorTokenAccount
 * @param {string}           args.tokenProgram         — 'spl-token' | 'spl-token-2022'
 * @param {bigint|number}    args.goalAmount           — raw token units
 * @param {bigint|number}    args.maturityUnix         — 0 = no maturity gate
 * @param {bigint|number}    args.initialDeposit       — raw token units
 */
export function buildInitializeSavingsIx(args) {
  assertLive();
  const creator = toPk(args.creator);
  const asset = toPk(args.asset);
  const recipient = toPk(args.recipient);
  const mint = toPk(args.mint);
  const creatorTokenAccount = toPk(args.creatorTokenAccount);
  const tokenProgram = new PublicKey(TOKEN_PROGRAMS[args.tokenProgram]);
  const [savings] = deriveSavingsPda(asset);
  const [vault]   = deriveSavingsVault(asset);

  const data = Buffer.concat([
    DISCRIMINATORS.initialize_savings,
    encodeU64(args.goalAmount),
    encodeI64(args.maturityUnix),
    encodeU64(args.initialDeposit),
  ]);

  const keys = [
    { pubkey: creator,             isSigner: true,  isWritable: true },
    { pubkey: asset,               isSigner: false, isWritable: false },
    { pubkey: recipient,           isSigner: false, isWritable: false },
    { pubkey: mint,                isSigner: false, isWritable: false },
    { pubkey: creatorTokenAccount, isSigner: false, isWritable: true },
    { pubkey: savings,             isSigner: false, isWritable: true },
    { pubkey: vault,               isSigner: false, isWritable: true },
    { pubkey: tokenProgram,        isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId,     isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ programId: JUICE_ESCROW_PROGRAM_ID, keys, data });
}

export function buildDepositIx(args) {
  assertLive();
  const depositor = toPk(args.depositor);
  const asset = toPk(args.asset);
  const mint = toPk(args.mint);
  const depositorTokenAccount = toPk(args.depositorTokenAccount);
  const tokenProgram = new PublicKey(TOKEN_PROGRAMS[args.tokenProgram]);
  const [savings] = deriveSavingsPda(asset);
  const [vault]   = deriveSavingsVault(asset);

  const data = Buffer.concat([DISCRIMINATORS.deposit, encodeU64(args.amount)]);

  const keys = [
    { pubkey: depositor,             isSigner: true,  isWritable: true },
    { pubkey: savings,               isSigner: false, isWritable: true },
    { pubkey: vault,                 isSigner: false, isWritable: true },
    { pubkey: mint,                  isSigner: false, isWritable: false },
    { pubkey: depositorTokenAccount, isSigner: false, isWritable: true },
    { pubkey: tokenProgram,          isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ programId: JUICE_ESCROW_PROGRAM_ID, keys, data });
}

export function buildClaimIx(args) {
  assertLive();
  const claimer = toPk(args.claimer);
  const asset = toPk(args.asset);
  const mint = toPk(args.mint);
  const claimerTokenAccount = toPk(args.claimerTokenAccount);
  const tokenProgram = new PublicKey(TOKEN_PROGRAMS[args.tokenProgram]);
  const [savings] = deriveSavingsPda(asset);
  const [vault]   = deriveSavingsVault(asset);

  const data = Buffer.concat([DISCRIMINATORS.claim, encodeU64(args.amount)]);

  const keys = [
    { pubkey: claimer,             isSigner: true,  isWritable: true },
    { pubkey: savings,             isSigner: false, isWritable: true },
    { pubkey: vault,               isSigner: false, isWritable: true },
    { pubkey: asset,               isSigner: false, isWritable: false },
    { pubkey: mint,                isSigner: false, isWritable: false },
    { pubkey: claimerTokenAccount, isSigner: false, isWritable: true },
    { pubkey: tokenProgram,        isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ programId: JUICE_ESCROW_PROGRAM_ID, keys, data });
}

export function buildCancelIx(args) {
  assertLive();
  const creator = toPk(args.creator);
  const asset = toPk(args.asset);
  const mint = toPk(args.mint);
  const creatorTokenAccount = toPk(args.creatorTokenAccount);
  const tokenProgram = new PublicKey(TOKEN_PROGRAMS[args.tokenProgram]);
  const [savings] = deriveSavingsPda(asset);
  const [vault]   = deriveSavingsVault(asset);

  const data = Buffer.from(DISCRIMINATORS.cancel);

  const keys = [
    { pubkey: creator,             isSigner: true,  isWritable: true },
    { pubkey: savings,             isSigner: false, isWritable: true },
    { pubkey: vault,               isSigner: false, isWritable: true },
    { pubkey: mint,                isSigner: false, isWritable: false },
    { pubkey: creatorTokenAccount, isSigner: false, isWritable: true },
    { pubkey: tokenProgram,        isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({ programId: JUICE_ESCROW_PROGRAM_ID, keys, data });
}

// ── Account reader (fetches and decodes a SavingsAccount) ────────────

/**
 * Fetch and decode a SavingsAccount PDA. Returns null when the account
 * doesn't exist yet OR when the live flag is off (so UIs can render
 * "no escrow yet" without checking the flag separately).
 *
 * @param {object} connection — web3.js Connection
 * @param {PublicKey|string} assetAddress
 */
export async function fetchSavingsAccount(connection, assetAddress) {
  if (!JUICE_ESCROW_LIVE) return null;
  const [savings] = deriveSavingsPda(assetAddress);
  const account = await connection.getAccountInfo(savings, 'confirmed');
  if (!account) return null;
  return decodeSavingsAccount(account.data);
}

/**
 * Decode the raw account data of a SavingsAccount PDA into a JS object.
 * Field order MUST match anchor/programs/juice_escrow/src/state.rs.
 */
export function decodeSavingsAccount(buf) {
  const data = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  let o = 8; // skip Anchor discriminator
  const readPk = () => {
    const pk = new PublicKey(data.slice(o, o + 32)); o += 32; return pk;
  };
  const readU64 = () => { const n = data.readBigUInt64LE(o); o += 8; return n; };
  const readI64 = () => { const n = data.readBigInt64LE(o);  o += 8; return n; };
  const readU32 = () => { const n = data.readUInt32LE(o);    o += 4; return n; };
  const readU8  = () => { const n = data.readUInt8(o);       o += 1; return n; };

  return {
    asset: readPk(),
    mint: readPk(),
    tokenProgram: readPk(),
    creator: readPk(),
    originalRecipient: readPk(),
    goalAmountRaw: readU64(),
    depositsTotalRaw: readU64(),
    depositCount: readU32(),
    maturityUnix: readI64(),
    createdUnix: readI64(),
    lockedForCreator: readU8() !== 0,
    bump: readU8(),
    vaultBump: readU8(),
    // _reserved [u8; 64] follows but isn't surfaced
  };
}

// ── Helpers ──────────────────────────────────────────────────────────

function toPk(x) {
  return x instanceof PublicKey ? x : new PublicKey(x);
}

function encodeU64(value) {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(value));
  return buf;
}

function encodeI64(value) {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64LE(BigInt(value));
  return buf;
}

function assertLive() {
  if (!JUICE_ESCROW_LIVE) {
    throw new Error(
      'juice_escrow not yet deployed. See apps/pusd-sundollar/src/solana/juice-escrow-client.js header for the deploy checklist.'
    );
  }
}

// ── Backwards-compat (keeps Sprint 1 callers happy) ───────────────────

export async function initializeSavings(/* { connection, wallet, ... } */) { assertLive(); }
export async function deposit(/* args */) { assertLive(); }
export async function claim(/* args */)   { assertLive(); }
export async function cancel(/* args */)  { assertLive(); }
export async function fetchSavings(connection, assetAddress) {
  return fetchSavingsAccount(connection, assetAddress);
}
