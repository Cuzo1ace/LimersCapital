# Send Juice — end-to-end devnet test

A 5-minute walkthrough that exercises the full send flow + savings receipt mint on Solana devnet. Use this before any hackathon demo to confirm the on-chain artifact is real.

> PUSD has **no devnet mint** — Palm USD only ships on mainnet. The devnet rehearsal therefore uses **USDC-devnet** as the rail. The transfer code path is identical (Token-2022 vs legacy SPL routing happens automatically via `getTokenProgramId(stablecoin)`), so a working USDC-devnet send proves the PUSD-mainnet send will work too.

## Prereqs

- A Solana wallet that supports `wallet-standard` (Phantom, Solflare, Backpack, etc.)
- Cluster set to **Devnet** in Limer's Capital header (gold "DEVNET" pill)
- A second Solana wallet to receive the test transfer (or just any devnet address you control)

## Steps

### 1. Connect

1. Open `http://localhost:3000/`, click the SEND tab between News and Trade.
2. In the Limer header, click **Connect Solana Wallet**, pick your wallet, approve the connection.
3. The header should now show your wallet handle + the gold DEVNET pill.

### 2. Fund

The **Devnet helpers** card appears below the Corridor Calculator once you're connected on devnet. It surfaces your live SOL + USDC balances and two funding actions:

- **Request 1 SOL airdrop** — uses the public devnet RPC. Settles in a few seconds. The button auto-refreshes the SOL balance after the airdrop lands.
- **Get devnet USDC ↗** — opens [faucet.circle.com](https://faucet.circle.com/?chain=solana) in a new tab. Pick "Solana Devnet", paste your wallet address, request 10 USDC. The faucet rate-limits to roughly one drip per address per hour.

Wait until your **SOL > 0.01** (covers tx fees + ATA rent) and **USDC ≥ amount you want to send**.

### 3. Send

In the **Send Flow** card directly below:

1. Confirm rail picker shows **USDC** highlighted in green (PUSD/USDPT have the warn `·` since they have no devnet mint).
2. Paste a recipient Solana address into **Recipient (Solana address)**.
3. Type an amount, e.g. `1` USDC.
4. Hit **Send 1 USDC** at the bottom.
5. Approve the signature in your wallet popup.

After a couple of seconds you'll see:

- ✓ **Sent 1 USDC on Devnet** in green
- The signature as a clickable Solscan link — clicking opens `solscan.io/tx/<sig>?cluster=devnet` to verify on-chain

### 4. Send + savings receipt

Same flow, but before clicking the Send button:

1. Expand **▸ Add a savings goal** at the bottom of the Send Flow card.
2. Optionally type a **Goal amount** (e.g. `5000`).
3. Optionally pick a **Maturity date** (any future date works).
4. The Send button now reads **Send 1 USDC + mint receipt**.
5. Approve **two** signatures in your wallet — first for the SPL transfer, second for the Metaplex Core NFT mint.

After both confirmations:

- The transfer success row renders as before.
- A new "Receipt minted to recipient" line appears with two Solscan links: the asset address and the mint tx.
- Open the asset link to see the on-chain Core NFT — it should show your goal amount and maturity in the Attributes plugin.

### 5. Verify the receipt landed in the recipient's wallet

If the recipient is a wallet you control:

1. Switch to that wallet in your wallet extension.
2. Solscan the asset URL or open the wallet's NFT view — the **Send Juice Savings · X USDC** Core NFT should be listed.
3. Confirm the owner is the recipient address, not the sender.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| "USDC has no devnet mint" gate showing | Cluster is mainnet but USDC mainnet behaves differently | Switch to Devnet via the header pill |
| Airdrop button errors with rate limit | Public devnet RPC enforces ~1 SOL/8h/IP | Wait, or try `faucet.solana.com` directly |
| Send button stuck on "Awaiting wallet signature…" | Wallet popup got dismissed | Reload, approve cleanly |
| Transfer succeeds, receipt mint fails | Asset signing collision, RPC flake | Click **retry** on the failed-mint row |
| Receipt mint silent — no popup | Wallet doesn't expose `solana:signAndSendTransaction` feature | Use Phantom/Solflare/Backpack; older wallet adapters won't work |

## What this *doesn't* test

- **PUSD on mainnet** — same code path, but to test it for real you need mainnet PUSD in your wallet (no faucet, you have to acquire it through Palm USD's normal channels)
- **Sprint 2 escrow program** — the receipt today is owner-updatable, no token lock. The `juice_escrow` Anchor program in `anchor/programs/juice_escrow/` is scaffolded but instruction bodies are unimplemented; deploy + wire-up is the next milestone.
- **Privy embedded wallet** — only the wallet-standard external-wallet path is wired. Privy onboarding is a future track.
