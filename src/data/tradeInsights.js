/**
 * Post-Trade Teaching Moments
 *
 * Contextual insights shown after trade execution to teach users
 * something relevant to what they just did. Each insight links to
 * a related lesson and surfaces glossary terms.
 *
 * Selection: pickInsight(trade, state) examines trade properties
 * and user progress to pick the most relevant, unseen insight.
 */

const TRADE_INSIGHTS = [
  // ── First Actions ─────────────────────────────────────────
  {
    id: 'first_buy',
    trigger: 'first_buy',
    title: 'Your First Paper Trade',
    insight: 'You just executed your first paper trade with virtual funds. This is how professional traders practice — testing strategies without risking real capital. Every trade you make here earns XP and builds your skills.',
    lessonId: '1-1',
    glossaryTerms: ['paper-trading'],
    caribbeanContext: 'Caribbean exchanges like the TTSE have limited practice tools — Limer\'s gives you what institutions have.',
  },
  {
    id: 'first_perp',
    trigger: 'first_perp',
    title: 'Welcome to Perpetual Futures',
    insight: 'Perpetual futures let you trade with leverage — amplifying both gains and losses. Unlike spot trading, you can go "short" to profit when prices drop. Your leverage multiplies your exposure but also your risk.',
    lessonId: '3-1',
    glossaryTerms: ['leverage', 'perpetual'],
    caribbeanContext: 'Perps are the most traded instrument in crypto — more volume than spot markets globally.',
  },
  {
    id: 'first_ttse',
    trigger: 'first_ttse',
    title: 'Trading Caribbean Stocks',
    insight: 'You just traded a TTSE-listed stock. The Trinidad & Tobago Stock Exchange is one of the Caribbean\'s most active markets, with companies like RFHL, Massy, and NCB. Traditional settlement takes T+3 days — blockchain could make it instant.',
    lessonId: '2-1',
    glossaryTerms: ['ttse', 'settlement'],
    caribbeanContext: 'The TTSE has a market cap over TT$140 billion, making it one of the largest exchanges in the English-speaking Caribbean.',
  },

  // ── Profit & Loss ─────────────────────────────────────────
  {
    id: 'sell_at_profit',
    trigger: 'sell_at_profit',
    title: 'You Locked In Profit',
    insight: 'Taking profit is a discipline many traders struggle with. Knowing when to exit is just as important as knowing when to enter. Consider setting take-profit levels in advance to remove emotion from the decision.',
    lessonId: '4-2',
    glossaryTerms: ['pnl', 'take-profit'],
  },
  {
    id: 'sell_at_loss',
    trigger: 'sell_at_loss',
    title: 'Managing Losses',
    insight: 'Every trader takes losses — what matters is managing them. Stop-loss orders automatically close positions at a set price, preventing small losses from becoming large ones. Professional traders typically risk only 1-2% of their portfolio per trade.',
    lessonId: '4-2',
    glossaryTerms: ['stop-loss', 'risk-management'],
  },
  {
    id: 'perp_profit',
    trigger: 'perp_profit',
    title: 'Leveraged Profit',
    insight: 'Your leveraged position paid off! Remember: the same leverage that amplified this gain would amplify a loss equally. Consistent profitability comes from risk management, not higher leverage.',
    lessonId: '4-1',
    glossaryTerms: ['leverage', 'pnl'],
  },
  {
    id: 'perp_loss',
    trigger: 'perp_loss',
    title: 'Learning from Leveraged Losses',
    insight: 'Leverage cuts both ways. Many experienced traders use lower leverage (2-5x) with tighter risk management rather than high leverage. Consider using stop-losses and smaller position sizes relative to your balance.',
    lessonId: '4-2',
    glossaryTerms: ['leverage', 'stop-loss'],
  },

  // ── Strategy Patterns ─────────────────────────────────────
  {
    id: 'dca_detected',
    trigger: 'dca_detected',
    title: 'Dollar-Cost Averaging',
    insight: 'You bought more of a token you already hold — this is called dollar-cost averaging (DCA). By spreading purchases over time, you reduce the impact of volatility on your average entry price. It\'s one of the simplest and most effective strategies.',
    lessonId: '4-2',
    glossaryTerms: ['dca'],
  },
  {
    id: 'diversification',
    trigger: 'diversification',
    title: 'Portfolio Diversification',
    insight: 'You now hold positions across different markets! Diversification reduces risk because different assets don\'t always move in the same direction. A mix of crypto and traditional stocks (like TTSE) gives you exposure to uncorrelated markets.',
    lessonId: '4-2',
    glossaryTerms: ['correlation', 'portfolio'],
    caribbeanContext: 'Caribbean investors can uniquely diversify across TTSE equities, Solana DeFi, and tokenized real-world assets — all from one platform.',
  },
  {
    id: 'large_position',
    trigger: 'large_position',
    title: 'Position Sizing Matters',
    insight: 'That trade used a significant portion of your portfolio. Professional traders typically limit each position to 5-10% of their total capital. This way, no single trade can cause devastating losses even in a worst-case scenario.',
    lessonId: '4-2',
    glossaryTerms: ['risk-management'],
  },

  // ── Leverage & Risk ───────────────────────────────────────
  {
    id: 'high_leverage',
    trigger: 'high_leverage',
    title: 'High Leverage Warning',
    insight: 'You opened a position with 10x+ leverage. At this level, a 10% price move against you could liquidate your entire position. Most professional derivatives traders use 2-5x leverage and rely on strategy, not leverage, for returns.',
    lessonId: '4-1',
    glossaryTerms: ['leverage', 'liquidation'],
  },
  {
    id: 'perp_liquidated',
    trigger: 'perp_liquidated',
    title: 'Understanding Liquidation',
    insight: 'Your position was liquidated — the exchange automatically closed it because your margin couldn\'t cover further losses. This happens when price moves too far against a leveraged position. Lower leverage and stop-losses help prevent liquidation.',
    lessonId: '4-1',
    glossaryTerms: ['liquidation', 'margin', 'leverage'],
  },
  {
    id: 'used_stop_loss',
    trigger: 'used_stop_loss',
    title: 'Smart Risk Management',
    insight: 'You set a stop-loss on your position — that\'s what disciplined traders do. A stop-loss defines your maximum acceptable loss before entering a trade, removing emotion from the exit decision.',
    lessonId: '4-2',
    glossaryTerms: ['stop-loss', 'risk-management'],
  },
  {
    id: 'used_trailing_stop',
    trigger: 'used_trailing_stop',
    title: 'Trailing Stops: Locking in Gains',
    insight: 'A trailing stop follows the price as it moves in your favor, then triggers if it reverses by your set percentage. It lets you ride trends while protecting profits — one of the most powerful tools in a trader\'s arsenal.',
    lessonId: '4-2',
    glossaryTerms: ['trailing-stop'],
  },

  // ── Market Concepts ───────────────────────────────────────
  {
    id: 'shorting',
    trigger: 'shorting',
    title: 'Profiting from Downturns',
    insight: 'You opened a short position — betting the price will fall. Short selling is essential for hedging and allows you to profit in bear markets. In traditional finance, shorting requires borrowing assets; in crypto perpetuals, it\'s built into the contract.',
    lessonId: '3-1',
    glossaryTerms: ['perpetual'],
  },
  {
    id: 'rwa_trade',
    trigger: 'rwa_trade',
    title: 'Trading Real-World Assets',
    insight: 'You traded a tokenized real-world asset (RWA). These tokens represent ownership of real financial instruments — like Treasury bills or gold — on the blockchain. RWAs are one of the fastest-growing sectors in DeFi.',
    lessonId: '1-1',
    glossaryTerms: ['rwa'],
    caribbeanContext: 'Caribbean nations are exploring tokenizing everything from government bonds to real estate on Solana.',
  },
  {
    id: 'gold_trade',
    trigger: 'gold_trade',
    title: 'Digital Gold',
    insight: 'GOLD tokens represent tokenized gold on Solana. Gold has been a store of value for thousands of years and is often used as a hedge against inflation and currency devaluation — particularly relevant for Caribbean economies.',
    lessonId: '1-1',
    glossaryTerms: ['rwa'],
    caribbeanContext: 'With TTD and JMD facing inflation pressure, gold exposure gives Caribbean investors a traditional safe haven in a modern wrapper.',
  },

  // ── Repeat Engagement ─────────────────────────────────────
  {
    id: 'tenth_trade',
    trigger: 'tenth_trade',
    title: 'Building a Track Record',
    insight: 'You\'ve completed 10 trades! Now\'s a great time to review your portfolio. Look at which trades were profitable and which weren\'t — identifying patterns in your decisions is how traders improve over time.',
    lessonId: '4-2',
    glossaryTerms: ['portfolio'],
  },
  {
    id: 'market_order_concept',
    trigger: 'market_order',
    title: 'Market vs Limit Orders',
    insight: 'You placed a market order — it fills immediately at the current price. Limit orders let you set a specific price and only execute when the market reaches it. Limit orders give you better price control but may not fill.',
    lessonId: '3-1',
    glossaryTerms: ['slippage', 'order-book'],
  },
  {
    id: 'funding_rate',
    trigger: 'funding_rate',
    title: 'Understanding Funding Rates',
    insight: 'Perpetual futures use a funding rate mechanism to keep contract prices close to spot prices. When funding is positive, longs pay shorts; when negative, shorts pay longs. This cost can eat into profits on long-held positions.',
    lessonId: '3-1',
    glossaryTerms: ['funding-rate', 'perpetual'],
  },
  {
    id: 'solana_speed',
    trigger: 'solana_trade',
    title: 'Solana: Built for Speed',
    insight: 'Solana processes thousands of transactions per second with ~400ms finality and fees under $0.001. This makes it ideal for trading applications where speed matters — traditional exchanges can take days to settle.',
    lessonId: '3-1',
    glossaryTerms: ['solana'],
    caribbeanContext: 'For Caribbean users, Solana\'s low fees mean you can trade actively without costs eating into small positions.',
  },
];

// ── RWA token detection ─────────────────────────────────────
const RWA_TOKENS = ['ONDO', 'USDY', 'BUIDL', 'GOLD'];

/**
 * Pick the most relevant, unseen insight for a trade.
 *
 * @param {object} trade - The trade that just executed
 *   { side, symbol, qty, price, total, market, leverage?, pnl? }
 * @param {object} state - Current store state
 *   { trades, holdings, perpPositions, lessonsRead, teachingMomentsViewed, perpTradeCount }
 * @returns {object|null} The selected insight, or null
 */
export function pickInsight(trade, state) {
  const viewed = state.teachingMomentsViewed || [];
  const tradeCount = (state.trades || []).length;
  const perpCount = state.perpTradeCount || 0;
  const holdings = state.holdings || [];
  const isPerp = trade.market === 'perpetuals';
  const isTTSE = trade.market === 'ttse';
  const isRWA = RWA_TOKENS.includes(trade.symbol?.toUpperCase());

  // Build a priority list of trigger keys based on what just happened
  const triggers = [];

  // First-ever actions (highest priority)
  if (tradeCount <= 1 && !isPerp) triggers.push('first_buy');
  if (isPerp && perpCount <= 1 && trade.side?.includes('perp_')) triggers.push('first_perp');
  if (isTTSE && !viewed.includes('first_ttse')) triggers.push('first_ttse');

  // Liquidation
  if (trade.side === 'liquidated' || trade.pnl < -(trade.total || 0) * 0.9) triggers.push('perp_liquidated');

  // Profit/Loss on sells & perp closes
  if (trade.pnl !== undefined) {
    if (trade.pnl > 0 && isPerp) triggers.push('perp_profit');
    else if (trade.pnl < 0 && isPerp) triggers.push('perp_loss');
    else if (trade.pnl > 0) triggers.push('sell_at_profit');
    else if (trade.pnl < 0) triggers.push('sell_at_loss');
  }

  // Leverage
  if (isPerp && trade.leverage >= 10) triggers.push('high_leverage');

  // Stop loss / trailing stop usage
  if (trade.stopLoss) triggers.push('used_stop_loss');
  if (trade.trailingStop) triggers.push('used_trailing_stop');

  // Shorting
  if (trade.side === 'perp_short') triggers.push('shorting');

  // DCA detection — buying same token again
  if (trade.side === 'buy') {
    const alreadyHeld = holdings.some(h => h.symbol === trade.symbol && h.market === trade.market);
    if (alreadyHeld) triggers.push('dca_detected');
  }

  // Position size relative to portfolio
  if (trade.total > (state.balanceUSD || 100000) * 0.2) triggers.push('large_position');

  // Diversification — first cross-market position
  const hasSOL = holdings.some(h => h.market === 'solana');
  const hasTTSE = holdings.some(h => h.market === 'ttse');
  if ((hasSOL && isTTSE) || (hasTTSE && !isTTSE && trade.market === 'solana')) triggers.push('diversification');

  // RWA and gold trades
  if (trade.symbol === 'GOLD') triggers.push('gold_trade');
  else if (isRWA) triggers.push('rwa_trade');

  // Milestone
  if (tradeCount === 10) triggers.push('tenth_trade');

  // General concepts (lower priority, fill gaps)
  if (isPerp) triggers.push('funding_rate');
  if (!isPerp && !isTTSE) triggers.push('solana_trade');
  triggers.push('market_order');

  // Find first unviewed insight
  for (const trigger of triggers) {
    const insight = TRADE_INSIGHTS.find(i => i.trigger === trigger);
    if (insight && !viewed.includes(insight.id)) {
      return insight;
    }
  }

  return null;
}

export { TRADE_INSIGHTS };
