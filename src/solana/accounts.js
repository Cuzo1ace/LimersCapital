import { address } from '@solana/kit';

const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

/**
 * Fetch native SOL balance for a wallet address.
 */
export async function fetchSolBalance(rpc, walletAddress) {
  const { value: balanceLamports } = await rpc
    .getBalance(address(walletAddress), { commitment: 'confirmed' })
    .send();

  return {
    lamports: balanceLamports,
    sol: Number(balanceLamports) / 1e9,
  };
}

/**
 * Fetch all SPL token accounts owned by a wallet.
 * Returns parsed token data: mint, balance, decimals.
 */
export async function fetchTokenAccounts(rpc, walletAddress) {
  const { value: accounts } = await rpc
    .getTokenAccountsByOwner(
      address(walletAddress),
      { programId: address(TOKEN_PROGRAM_ID) },
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
    .filter(t => t.balance > 0); // Hide zero-balance accounts
}

/**
 * Request a devnet airdrop (1 SOL by default).
 * Only works on devnet — will fail on mainnet.
 */
export async function requestDevnetAirdrop(rpc, walletAddress, solAmount = 1) {
  const lamportAmount = BigInt(Math.round(solAmount * 1e9));
  const signature = await rpc
    .requestAirdrop(address(walletAddress), lamportAmount, { commitment: 'confirmed' })
    .send();
  return signature;
}
