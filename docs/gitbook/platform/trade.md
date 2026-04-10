# Trade -- Paper Trading & Real Swaps

Limer's Capital provides four trading modes that take users from zero-risk simulation to real on-chain execution.

## Trading Modes

| Mode | Assets | Risk Level | Status |
|------|--------|------------|--------|
| **Solana Spot Paper** | 14 tokens (SOL, USDC, JUP, BONK, etc.) | Zero -- simulated funds | Live |
| **TTSE Paper** | ~30 Caribbean stocks (ANSA McAL, Republic Bank, etc.) | Zero -- simulated funds | Live |
| **Perpetuals Simulator** | BTC, ETH, SOL perpetuals up to 20x leverage | Zero -- simulated funds | Live |
| **Jupiter Real Swaps** | All Jupiter-listed tokens | Real -- actual on-chain value | Live |

## Starting Balances

Paper trading accounts start with generous balances for meaningful practice:

- **USD Account**: $100,000 virtual USD
- **TTD Account**: TT$679,000 virtual TTD

## Order Types

- **Market orders** -- instant execution at current price
- **Limit orders** -- execute when price reaches your target
- **Stop loss** -- automatic sell to limit downside
- **Take profit** -- automatic sell to lock in gains

## Order Book

The platform includes a simulated order book with bid/ask spreads derived from real Jupiter and TTSE price feeds. Perpetuals use a competition-grade liquidation engine with funding rates, margin calculations, and position sizing.

## Real Trading

When ready, users connect a Solana wallet and execute real swaps through Jupiter V6 aggregation -- same interface, real assets.

[Learn how trading earns you rewards -->](earn.md)
