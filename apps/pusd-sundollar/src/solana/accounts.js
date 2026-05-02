import { address } from '@solana/kit';
import { PublicKey, Transaction } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';

const TOKEN_PROGRAM_ID_STR = TOKEN_PROGRAM_ID.toBase58();

/**
 * Native SOL balance for any wallet. Uses @solana/kit RPC.
 */
export async function fetchSolBalance(rpc, walletAddress) {
  const { value: lamports } = await rpc
    .getBalance(address(walletAddress), { commitment: 'confirmed' })
    .send();
  return { lamports, sol: Number(lamports) / 1e9 };
}

/**
 * SPL token balance for a specific mint. Returns 0 if no ATA exists.
 */
export async function fetchTokenBalanceByMint(rpc, walletAddress, mintAddress) {
  const { value: accounts } = await rpc
    .getTokenAccountsByOwner(
      address(walletAddress),
      { mint: address(mintAddress) },
      { encoding: 'jsonParsed', commitment: 'confirmed' }
    )
    .send();
  if (!accounts.length) return { balance: 0, decimals: 0, rawAmount: '0', exists: false };
  const parsed = accounts[0].account.data?.parsed?.info;
  return {
    balance: parsed.tokenAmount?.uiAmount ?? 0,
    decimals: parsed.tokenAmount?.decimals ?? 0,
    rawAmount: parsed.tokenAmount?.amount ?? '0',
    exists: true,
  };
}

/**
 * All non-zero SPL holdings for a wallet (legacy SPL Token program only).
 */
export async function fetchTokenAccounts(rpc, walletAddress) {
  const { value: accounts } = await rpc
    .getTokenAccountsByOwner(
      address(walletAddress),
      { programId: address(TOKEN_PROGRAM_ID_STR) },
      { encoding: 'jsonParsed', commitment: 'confirmed' }
    )
    .send();
  return accounts
    .map(({ pubkey, account }) => {
      const parsed = account.data?.parsed?.info;
      if (!parsed) return null;
      return {
        address: pubkey,
        mint: parsed.mint,
        balance: parsed.tokenAmount?.uiAmount ?? 0,
        decimals: parsed.tokenAmount?.decimals ?? 0,
        rawAmount: parsed.tokenAmount?.amount ?? '0',
      };
    })
    .filter(Boolean)
    .filter((t) => t.balance > 0);
}

export async function requestDevnetAirdrop(rpc, walletAddress, solAmount = 1) {
  const lamports = BigInt(Math.round(solAmount * 1e9));
  return rpc
    .requestAirdrop(address(walletAddress), lamports, { commitment: 'confirmed' })
    .send();
}

/**
 * Build an unsigned transaction that:
 *   1. Idempotently creates the recipient's ATA if missing (sender pays rent).
 *   2. Transfers `uiAmount` of `mint` from sender → recipient via TransferChecked.
 *
 * Routes through the legacy SPL Token program by default; pass
 * `tokenProgramId: TOKEN_2022_PROGRAM_ID` (or its base58 string from
 * stablecoins.js → TOKEN_PROGRAMS['spl-token-2022']) for Token-2022 mints
 * like PUSD. Both ATA derivation and the Transfer / ATA-create instructions
 * must use the same program — that's what was wrong with the v1 of this fn.
 *
 * The caller is responsible for signing + sending. We return a legacy
 * Transaction (not Versioned) because it composes more cleanly with most
 * wallet adapters and the tx is small enough that we don't need ALTs.
 *
 * @param {object}                 connection      web3.js Connection (mainnet or devnet)
 * @param {object}                 args
 * @param {PublicKey}              args.sender
 * @param {string}                 args.recipient       base58 wallet address
 * @param {string}                 args.mint            base58 mint address
 * @param {number}                 args.decimals        SPL decimals for the mint
 * @param {number}                 args.uiAmount        human amount, e.g. 25.5
 * @param {PublicKey|string}      [args.tokenProgramId] defaults to legacy SPL Token
 */
export async function buildStablecoinTransferTx(
  connection,
  { sender, recipient, mint, decimals, uiAmount, tokenProgramId = TOKEN_PROGRAM_ID }
) {
  if (!(sender instanceof PublicKey)) throw new Error('sender must be a PublicKey');
  if (!recipient) throw new Error('recipient required');
  if (!mint) throw new Error('mint required');
  if (!Number.isFinite(uiAmount) || uiAmount <= 0) throw new Error('uiAmount must be > 0');

  const programPk = tokenProgramId instanceof PublicKey
    ? tokenProgramId
    : new PublicKey(tokenProgramId);

  const recipientPk = new PublicKey(recipient);
  const mintPk = new PublicKey(mint);

  const senderAta = getAssociatedTokenAddressSync(mintPk, sender, false, programPk);
  const recipientAta = getAssociatedTokenAddressSync(mintPk, recipientPk, false, programPk);

  const rawAmount = BigInt(Math.round(uiAmount * 10 ** decimals));

  const instructions = [
    createAssociatedTokenAccountIdempotentInstruction(
      sender,         // payer
      recipientAta,   // ata
      recipientPk,    // owner
      mintPk,         // mint
      programPk,
      ASSOCIATED_TOKEN_PROGRAM_ID
    ),
    createTransferCheckedInstruction(
      senderAta,
      mintPk,
      recipientAta,
      sender,
      rawAmount,
      decimals,
      [],
      programPk
    ),
  ];

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const tx = new Transaction({ feePayer: sender, blockhash, lastValidBlockHeight });
  tx.add(...instructions);
  return tx;
}

// Re-export so the App / send-flow can pull the right program ID from one place.
export { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID };
