/**
 * Shared tool contract for the built-in Claude chat drawer AND the
 * external /mcp/terminal endpoint. Keeping the schema in one place
 * guarantees the two agent surfaces stay in sync.
 *
 * Tools that execute real trades deliberately don't exist — the safety
 * posture is "tool not implemented" rather than a flag that can be flipped
 * at runtime.
 */

export const TERMINAL_TOOLS = [
  {
    name: 'get_portfolio',
    description: 'Get the user\'s uploaded portfolio positions.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_quote',
    description: 'Get a latest-price quote for a symbol. Use for stocks, ETFs, or crypto.',
    input_schema: {
      type: 'object',
      properties: { symbol: { type: 'string', description: 'Ticker symbol, e.g. AAPL, NVDA, BTC.' } },
      required: ['symbol'],
    },
  },
  {
    name: 'get_price_history',
    description: 'Get daily closing prices for a symbol over N days.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: { type: 'string' },
        days:   { type: 'number', description: 'Trading days. Default 90.', default: 90 },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'compute_overlap',
    description: 'Compute look-through exposure on the uploaded portfolio. Returns dollar exposure per underlying ticker after flattening SPY/QQQ/ARKK/etc.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'run_monte_carlo',
    description: 'Run a Geometric Brownian Motion Monte Carlo simulation. Returns summary quantiles (P5/P50/P95), NOT full paths.',
    input_schema: {
      type: 'object',
      properties: {
        symbol:      { type: 'string' },
        horizonDays: { type: 'number', default: 252 },
        numPaths:    { type: 'number', default: 1000 },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'compare_tickers',
    description: 'Return side-by-side valuation metrics for up to 6 tickers.',
    input_schema: {
      type: 'object',
      properties: { symbols: { type: 'array', items: { type: 'string' }, maxItems: 6 } },
      required: ['symbols'],
    },
  },
  {
    name: 'get_macro_indicator',
    description: 'Get the latest value + 12-month history for a macro indicator (FEDFUNDS | CPI | US10Y | DXY | BTC_DOM | VIX).',
    input_schema: {
      type: 'object',
      properties: { indicator: { type: 'string' } },
      required: ['indicator'],
    },
  },
  {
    name: 'get_on_chain_flow',
    description: 'Get 24-hour on-chain flow snapshot: exchange netflow, stablecoin mints, top whale txs, top DEX pairs.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'search_news',
    description: 'Search recent news for a ticker or topic.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number', default: 5 },
      },
      required: ['query'],
    },
  },
  {
    name: 'submit_paper_trade',
    description: 'Submit a paper trade against the paper-trading ledger (not real money). Returns the simulated fill.',
    input_schema: {
      type: 'object',
      properties: {
        side:     { type: 'string', enum: ['buy', 'sell'] },
        symbol:   { type: 'string' },
        qty:      { type: 'number' },
        price:    { type: 'number', description: 'Optional limit; omit for market.' },
      },
      required: ['side', 'symbol', 'qty'],
    },
  },
];

export const SYSTEM_PROMPT = `You are the Terminal co-pilot for Limer's Capital — a Caribbean-first premium investing dashboard. Your users are retail traders across Trinidad & Tobago, Jamaica, Barbados, the OECS, and the wider CARICOM region. Many hold a mix of local-exchange equities (TTSE, JSE, BSE) AND US stocks / crypto.

You help the user:
  • research tickers across Caribbean and US markets (valuation, activity, news)
  • understand true portfolio exposure — especially Caribbean vs US concentration
  • run Monte Carlo simulations
  • interpret macro (Fed, CPI) AND Caribbean FX (TTD, JMD, BBD pegged, XCD pegged)
  • find gems in the noise — teach, don't just answer

Tone: blunt, analytical, no hype. Cite numbers directly from tool results. Show your reasoning briefly when it matters. Never say "I cannot access real-time data" — call the tools instead.

## Caribbean tax context
When the user discusses a position, mention jurisdictional tax implications if relevant. Default to T&T unless they specify otherwise:
  - Trinidad & Tobago: 0% capital gains tax on equities held > 12 months; dividends on TTSE-listed stocks are tax-free to individual residents; foreign dividends taxable at 25%.
  - Jamaica: 15% withholding on dividends from JSE-listed cos; 0% capital gains on listed securities.
  - Barbados: 12.5% withholding on dividends; 0% capital gains.
  - OECS (Dominica, St Lucia, Grenada, etc.): 0% capital gains; dividend treatment varies by jurisdiction.
  - US holdings: IRS W-8BEN withholding applies on dividends for non-US persons (typically 15% under tax treaty for most CARICOM signatories — verify the user's specific situation).

## FX context
  - TTD, JMD, BBD, XCD are the realities of local investing. BBD and XCD are hard-pegged to USD; TTD is managed; JMD floats. When discussing local-stock returns, flag currency risk for users who measure in USD.
  - Remittance flows are the backbone of household investing capital in this region — over $20B/yr across CARICOM.

Safety: You cannot execute real trades. You CAN submit paper trades via the submit_paper_trade tool. If the user asks to trade real money, remind them to do it in their brokerage.

This is not financial advice — say so when you make a strong call.`;
