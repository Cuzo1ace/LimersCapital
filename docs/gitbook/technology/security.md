# Security

Limer's Capital implements defense-in-depth security across the client, edge, and on-chain layers.

## Current Security Measures

### API Key Protection
All third-party API keys (Helius, Jupiter, FMP) are stored as Cloudflare Worker secrets. The client bundle contains zero API keys -- all external requests are proxied through Workers.

### Content Security Policy
Strict CSP headers enforce:
- `script-src` -- only same-origin and trusted CDNs
- `connect-src` -- whitelisted API endpoints only
- `frame-src` -- restricted to necessary embeds

### CORS Proxy Pattern
The ttse-proxy Worker adds CORS headers to TTSE data responses, preventing the need for client-side workarounds that could expose data.

### Supabase Row-Level Security
All Supabase tables use RLS policies ensuring users can only read and write their own data. No public tables exist.

### Wallet Security
- **wallet-standard** integration -- private keys never leave the wallet
- No seed phrase input, no key storage, no custodial features
- Connection is re-established on each session (wallet addresses not persisted to localStorage)

### Quiz Integrity
Quiz answers are validated server-side only. The client never receives correct answers, preventing client-side cheating.

### Transport Security
- HTTPS everywhere with HSTS headers
- Cloudflare edge encryption for all Worker traffic

## Planned Security Enhancements

| Enhancement | Status | Description |
|-------------|--------|-------------|
| Squads multi-sig | Planned (6 months) | 3-of-5 multi-sig for treasury and program upgrades |
| Shamir Secret Sharing | Planned | Key recovery mechanism for protocol admin keys |
| SOC 2 compliance | Long-term | Formal audit path for institutional partners |

[View the full architecture -->](architecture.md)
