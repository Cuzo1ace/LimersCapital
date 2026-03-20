# Solana Development Cookbook — caribcryptomap

A practical reference for Solana development patterns used in the caribcryptomap project. Each guide follows a consistent format: **Problem → Solution → Explanation → Gotchas → References**.

All code examples use the modern `@solana/kit` SDK (v2.x) unless noted otherwise.

## Guides

| # | Guide | Description |
|---|-------|-------------|
| 01 | [Wallet Connection](01-wallet-connection.md) | Wallet standard, multi-wallet support, @solana/react hooks |
| 02 | [RPC & Accounts](02-rpc-and-accounts.md) | Creating RPC clients, fetching balances, parsing account data |
| 03 | [Transactions](03-transactions.md) | Building transactions, priority fees, confirmation strategies |
| 04 | [SPL Tokens](04-spl-tokens.md) | Creating mints, transferring tokens, associated token accounts |
| 05 | [Jupiter Integration](05-jupiter-integration.md) | Quote API, swap execution, slippage protection |
| 06 | [PDAs & Programs](06-pdas-and-programs.md) | Program Derived Addresses, Anchor patterns, IDL usage |
| 07 | [Anchor Development](07-anchor-development.md) | Project structure, instruction handlers, account validation |
| 08 | [Testing](08-testing.md) | LiteSVM, Mollusk, local validator testing |
| 09 | [Security Patterns](09-security-patterns.md) | Signer checks, authority management, common vulnerabilities |
| 10 | [Caribbean Regulatory](10-caribbean-regulatory.md) | Regulatory considerations for Caribbean jurisdictions |

## Prerequisites

- Node.js 18+
- A Solana wallet browser extension (Solflare, Phantom, or Backpack)
- For program development (guides 06-08): Rust, Solana CLI, Anchor CLI

## Network Configuration

This project supports both **devnet** (testing) and **mainnet-beta** (production) with a user-facing toggle. Always develop and test on devnet first.

| Network | RPC Endpoint | Explorer |
|---------|-------------|----------|
| Devnet | `https://api.devnet.solana.com` | [Solscan Devnet](https://solscan.io/?cluster=devnet) |
| Mainnet | `https://api.mainnet-beta.solana.com` | [Solscan](https://solscan.io) |

For production, use a paid RPC provider (Helius, QuickNode, Triton) set via `VITE_SOLANA_RPC_URL`.

## Key Libraries

| Package | Purpose | Version |
|---------|---------|---------|
| `@solana/kit` | Core Solana SDK (replaces @solana/web3.js) | v2.x |
| `@solana/react` | React hooks for wallets & signing | v2.x |
| `@solana/spl-token` | SPL Token program interactions | v0.4.x |
| `@coral-xyz/anchor` | Anchor framework client | v0.30.x |
| `@wallet-standard/app` | Wallet standard detection | v1.x |
