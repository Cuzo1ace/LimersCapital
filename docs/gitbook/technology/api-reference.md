# API Reference

Limer's Capital uses Cloudflare Workers as an API proxy layer, keeping all API keys server-side and never exposing them in the client bundle.

## limer-api-proxy

The primary API proxy handles Solana RPC, price data, and financial data.

| Endpoint | Upstream | Description |
|----------|----------|-------------|
| `/rpc` | Helius RPC | Solana JSON-RPC proxy (getBalance, getTokenAccounts, etc.) |
| `/das` | Helius DAS | Digital Asset Standard queries (NFTs, compressed assets) |
| `/jupiter/price` | Jupiter v2 | Token price quotes and swap routing |
| `/fmp` | Financial Modeling Prep | Traditional market data for comparison charts |

### Example Request

```bash
GET /jupiter/price?ids=SOL,JUP,BONK
```

Returns JSON with current token prices in USD.

## ttse-proxy

A dedicated Worker that scrapes stockex.co.tt (the TTSE website) and serves structured data with proper CORS headers.

| Feature | Detail |
|---------|--------|
| Source | stockex.co.tt HTML scraping |
| Caching | 5-minute edge cache (Cloudflare CDN) |
| CORS | Open CORS headers for browser access |
| Format | JSON response with ticker, price, volume, change |

## KV Namespace

Cloudflare KV stores game state data including:

- Paper trading portfolio snapshots
- Competition leaderboard state
- Session-level rate limiting counters

## Authentication

All Worker endpoints are public (no API key required from the client). Rate limiting is applied at the edge via Cloudflare's built-in protections.

[See the security model -->](security.md)
