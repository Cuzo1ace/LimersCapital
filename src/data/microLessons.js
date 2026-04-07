/**
 * Micro-Lessons — Contextual inline teaching for DeFi/trading concepts.
 *
 * These are surfaced via the <MicroLesson> component, which wraps
 * existing <Tooltip> behavior with enhanced first-encounter teaching.
 */

const MICRO_LESSONS = [
  {
    slug: 'leverage',
    title: 'Leverage',
    content: 'Leverage multiplies your exposure — 5x leverage means $100 controls a $500 position. Gains AND losses are amplified. A 10x leveraged position can be wiped out by just a 10% adverse price move.',
    glossaryTerm: 'leverage',
    lessonId: '4-1',
  },
  {
    slug: 'liquidation',
    title: 'Liquidation',
    content: 'Liquidation happens when your margin can no longer cover losses on a leveraged position. The exchange automatically closes it to prevent further losses. Lower leverage and stop-losses help you avoid liquidation.',
    glossaryTerm: 'liquidation',
    lessonId: '4-1',
  },
  {
    slug: 'funding-rate',
    title: 'Funding Rate',
    content: 'Perpetual futures use funding rates to keep contract prices close to spot prices. When positive, longs pay shorts; when negative, shorts pay longs. This ongoing cost can eat into profits on long-held positions.',
    glossaryTerm: 'funding-rate',
    lessonId: '3-1',
  },
  {
    slug: 'stop-loss',
    title: 'Stop-Loss',
    content: 'A stop-loss order automatically closes your position when the price reaches a set level, limiting your downside. Professional traders set stop-losses BEFORE entering a trade to remove emotion from the decision.',
    glossaryTerm: 'stop-loss',
    lessonId: '4-2',
  },
  {
    slug: 'take-profit',
    title: 'Take-Profit',
    content: 'A take-profit order automatically closes your position at a predetermined profit target. It locks in gains before the market can reverse. Combining TP with SL creates a complete risk management framework.',
    glossaryTerm: 'take-profit',
    lessonId: '4-2',
  },
  {
    slug: 'trailing-stop',
    title: 'Trailing Stop',
    content: 'A trailing stop follows the price as it moves in your favor, then triggers if it reverses by a set percentage. It lets you ride trends while automatically protecting profits — the best of both worlds.',
    glossaryTerm: 'trailing-stop',
    lessonId: '4-2',
  },
  {
    slug: 'mark-price',
    title: 'Mark Price',
    content: 'The mark price is the fair value of a perpetual contract, calculated from the oracle price (like Pyth). It\'s used for liquidation calculations instead of the last traded price, protecting against price manipulation.',
    glossaryTerm: 'mark-price',
    lessonId: '3-1',
  },
  {
    slug: 'collateral',
    title: 'Collateral',
    content: 'Collateral is the margin you deposit to open a leveraged position. It acts as a security deposit — if your losses approach your collateral value, you get liquidated. More collateral = more room for price swings.',
    glossaryTerm: 'collateral',
    lessonId: '4-1',
  },
  {
    slug: 'slippage',
    title: 'Slippage',
    content: 'Slippage is the difference between your expected trade price and the actual execution price. It occurs in fast-moving markets or with large orders. Setting a slippage tolerance protects you from excessive price impact.',
    glossaryTerm: 'slippage',
    lessonId: '3-1',
  },
  {
    slug: 'pnl',
    title: 'P&L (Profit & Loss)',
    content: 'P&L tracks your gains and losses. Unrealized P&L is on open positions (paper profit). Realized P&L is from closed positions (actual profit). Focus on realized P&L — unrealized gains can disappear in seconds.',
    glossaryTerm: 'pnl',
    lessonId: '4-2',
  },
  {
    slug: 'tvl',
    title: 'TVL (Total Value Locked)',
    content: 'TVL measures the total capital deposited in a DeFi protocol. Higher TVL generally means more trust and deeper liquidity. But TVL alone doesn\'t mean a protocol is safe — always check audits and team reputation.',
    glossaryTerm: 'tvl',
    lessonId: '3-1',
  },
  {
    slug: 'market-cap',
    title: 'Market Cap',
    content: 'Market cap = price × circulating supply. It\'s a rough measure of a project\'s total value. Low market cap tokens can have explosive growth but also higher risk. Use market cap alongside volume and fundamentals.',
    glossaryTerm: 'market-cap',
    lessonId: '1-1',
  },
  {
    slug: 'volume',
    title: 'Trading Volume',
    content: 'Volume is the total amount traded in a period. High volume confirms price trends — a breakout on heavy volume is more reliable than one on thin trading. Volume is one of the most important indicators to watch.',
    glossaryTerm: 'volume',
    lessonId: '3-1',
  },
  {
    slug: 'dca',
    title: 'Dollar-Cost Averaging (DCA)',
    content: 'DCA means investing a fixed amount at regular intervals, regardless of price. You buy more when prices are low and less when high. It\'s one of the simplest and most effective long-term strategies.',
    glossaryTerm: 'dca',
    lessonId: '4-2',
  },
  {
    slug: 'rwa',
    title: 'Real-World Assets (RWA)',
    content: 'RWAs are traditional financial assets — Treasury bills, gold, real estate — tokenized on blockchain. They bring trillions in real-world value on-chain and offer yields backed by tangible assets.',
    glossaryTerm: 'rwa',
    lessonId: '1-1',
  },
  {
    slug: 'amm',
    title: 'Automated Market Maker (AMM)',
    content: 'AMMs replace traditional order books with liquidity pools and a mathematical formula. When you swap on Jupiter, an AMM calculates the price algorithmically. This enables 24/7 trading without centralized market makers.',
    glossaryTerm: 'amm',
    lessonId: '3-1',
  },
  {
    slug: 'oracle',
    title: 'Price Oracle',
    content: 'Oracles bring off-chain data (like real-world prices) onto the blockchain. Pyth Network powers Limer\'s Capital prices with sub-second updates from 90+ institutional sources. Without oracles, DeFi couldn\'t function.',
    glossaryTerm: 'oracle',
    lessonId: '3-1',
  },
  {
    slug: 'perpetual',
    title: 'Perpetual Futures',
    content: 'Perpetuals are futures contracts with no expiration date. Unlike traditional futures, you can hold them indefinitely. They use a funding rate mechanism to track the spot price and are the most traded instrument in crypto.',
    glossaryTerm: 'perpetual',
    lessonId: '3-1',
  },
  {
    slug: 'impermanent-loss',
    title: 'Impermanent Loss',
    content: 'When you provide liquidity to an AMM, if token prices diverge from when you deposited, you end up with less value than just holding. This "loss" is impermanent because it reverses if prices return to their original ratio.',
    glossaryTerm: 'impermanent-loss',
    lessonId: '3-1',
  },
  {
    slug: 'margin',
    title: 'Margin',
    content: 'Margin is the amount you need to deposit to maintain a leveraged position. If your position moves against you and your margin drops below the maintenance level, you face liquidation. Always monitor your margin ratio.',
    glossaryTerm: 'margin',
    lessonId: '4-1',
  },
  {
    slug: 'order-book',
    title: 'Order Book',
    content: 'An order book lists all buy and sell orders for an asset, organized by price. It shows supply and demand in real-time. Thick order books mean better liquidity and less slippage on your trades.',
    glossaryTerm: 'order-book',
    lessonId: '3-1',
  },
  {
    slug: 'correlation',
    title: 'Correlation',
    content: 'Correlation measures how two assets move relative to each other. Positively correlated assets rise and fall together; negatively correlated ones move opposite. Diversifying across uncorrelated assets reduces portfolio risk.',
    glossaryTerm: 'correlation',
    lessonId: '4-2',
  },
  {
    slug: 'risk-management',
    title: 'Risk Management',
    content: 'Risk management is the practice of limiting potential losses. Key principles: never risk more than 1-2% per trade, always use stop-losses, diversify, and size positions relative to your total capital.',
    glossaryTerm: 'risk-management',
    lessonId: '4-2',
  },
  {
    slug: 'solana',
    title: 'Solana Blockchain',
    content: 'Solana is a high-performance Layer 1 blockchain processing 4,000+ TPS with ~400ms finality and fees under $0.001. Its speed and low cost make it ideal for DeFi, NFTs, and real-time trading applications.',
    glossaryTerm: 'solana',
    lessonId: '1-1',
  },
  {
    slug: 'ttse',
    title: 'Trinidad & Tobago Stock Exchange',
    content: 'The TTSE is one of the Caribbean\'s largest stock exchanges, with a market cap exceeding TT$140B. Major listings include RFHL, Massy, and NCB. Tokenizing TTSE stocks on blockchain could enable instant settlement.',
    glossaryTerm: 'ttse',
    lessonId: '2-1',
  },
];

/**
 * Look up a micro-lesson by its slug.
 */
export function getMicroLesson(slug) {
  return MICRO_LESSONS.find(m => m.slug === slug) || null;
}

export { MICRO_LESSONS };
