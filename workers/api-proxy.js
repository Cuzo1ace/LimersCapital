/**
 * Cloudflare Worker — Limer's Capital API Proxy
 *
 * Protects sensitive API keys by keeping them server-side.
 * Routes requests to Helius RPC, CoinGecko, and other APIs
 * without exposing credentials to the browser.
 *
 * Features:
 *   - Origin allowlist (only limerscapital.com can call)
 *   - Per-IP rate limiting via Cloudflare KV
 *   - Request validation (allowed endpoints only)
 *   - API key injection server-side
 *   - Caching for price data (30s edge cache)
 *
 * Environment variables (set via wrangler secret):
 *   HELIUS_API_KEY     — Helius RPC + DAS API key
 *   ANTHROPIC_API_KEY  — Claude API key for AI market briefs
 *
 * Deploy:
 *   cd workers
 *   wrangler secret put HELIUS_API_KEY
 *   wrangler deploy api-proxy.js --name limer-api-proxy
 */

// ── Allowed origins ──
const ALLOWED_ORIGINS = [
  'https://www.limerscapital.com',
  'https://limerscapital.com',
  'https://caribcryptomap.pages.dev',
];

// Dev origins (only in non-production)
const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
];

function getAllowedOrigin(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allOrigins = env.ENVIRONMENT === 'production'
    ? ALLOWED_ORIGINS
    : [...ALLOWED_ORIGINS, ...DEV_ORIGINS];
  return allOrigins.includes(origin) ? origin : null;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

// ── Rate limiting (simple in-memory, resets per isolate) ──
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute per IP

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return true;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return false;
  return true;
}

// ── Quiz answer keys (server-side only — NEVER sent to client) ──
const QUIZ_ANSWERS = {
  'quiz-1': {
    answers: [1, 1, 2, 1, 2],
    explanations: [
      'RWAs are blockchain tokens representing ownership in physical or traditional financial assets — bonds, real estate, gold, stocks.',
      'Your seed phrase gives full control of your wallet. Anyone with it can steal all your assets. Never share it — not even with "support."',
      'Solana transactions typically cost less than $0.01 (around $0.00025), making it one of the cheapest blockchains for trading.',
      'A wallet stores your private keys and lets you send, receive, and interact with tokens on the blockchain. Popular Solana wallets: Solflare, Phantom.',
      'Ondo Finance tokenized US Treasury yields with USDY and brought institutional-grade RWA products to Solana.',
    ],
  },
  'quiz-2': {
    answers: [1, 1, 1, 1, 1],
    explanations: [
      'The TTSE trades Monday to Friday, 9:30 AM to 12:30 PM AST (Atlantic Standard Time).',
      'The Bahamas launched the Sand Dollar in October 2020 — the world\'s first fully deployed Central Bank Digital Currency.',
      'The Digital Assets and Registered Exchanges (DARE) Act provides a comprehensive licensing framework for digital asset businesses in the Bahamas.',
      '50 shares × TT$106.10 = TT$5,305. Always multiply price by number of shares to calculate your total cost.',
      'The TTSEC regulates the stock exchange, brokers, and listed companies to protect investors in Trinidad & Tobago.',
    ],
  },
  'quiz-3': {
    answers: [1, 1, 1, 1, 1],
    explanations: [
      'TVL (Total Value Locked) is the total capital deposited in a DeFi protocol\'s smart contracts. Higher TVL = more trust and usage.',
      'High volume means many investors are actively trading. Combined with price movement, it signals strong conviction behind the trade.',
      'Slippage happens when low liquidity causes your order to execute at a worse price than expected. More common in thinly-traded assets.',
      'Jupiter is Solana\'s leading DEX aggregator — it finds the best swap route across all liquidity pools to get you the best price.',
      'TT$1,358 ÷ 6.79 = ~$200 USD. Always convert when comparing TTSE prices (TTD) with Solana token prices (USD).',
    ],
  },
  'quiz-4': {
    answers: [1, 2, 1, 1, 2],
    explanations: [
      'A rug pull is when developers attract investment then drain the liquidity pool and vanish. Signs: anonymous team, unrealistic APY, no audit.',
      'Fake airdrops can contain malicious contracts. Approving or interacting with unknown tokens can give scammers access to drain your wallet.',
      'Risking only 1-2% per trade protects you from catastrophic losses. Even professional traders follow strict position sizing rules.',
      'TTSE stocks and Solana tokens have low correlation — when crypto drops, your TTD positions may hold value, and vice versa.',
      'Write your seed phrase on paper and store it securely. Never store it digitally — phones, cloud storage, and screenshots can all be hacked.',
    ],
  },
  'quiz-5': {
    answers: [1, 1, 1, 1, 0],
    explanations: [
      'LPs deposit tokens into pools so traders can swap against them. In return, LPs earn a share of every swap fee generated by the pool.',
      'When someone buys token X, they add Y and remove X from the pool. Less X available means X becomes more expensive — supply and demand.',
      'Impermanent Loss is the difference between holding tokens outright vs providing them as liquidity. It occurs when the price ratio changes from your entry.',
      'CLMMs let you focus capital in specific price ranges instead of 0 to infinity. This dramatically increases the fees earned per dollar of liquidity.',
      'Meteora DLMM uses discrete price bins instead of continuous ticks. Each bin holds liquidity at a specific price point with zero slippage within the bin.',
    ],
  },
  'quiz-6': {
    answers: [1, 1, 1, 1, 0],
    explanations: [
      'DAMM v2 distributes liquidity across the full range automatically with dynamic fees — ideal for passive LPs who do not want to actively manage.',
      'Smaller bin steps (1-2 bps) give more precision with more bins. This is better for stable pairs where price movements are small.',
      'Dynamic Vaults allocate deposits across multiple lending protocols (Solend, MarginFi, Kamino) to optimize yield automatically.',
      'Volume/TVL ratio is the key metric — higher ratio means more trading fees generated per dollar of liquidity deposited in the pool.',
      'One-sided LP means depositing just one token. It acts like a limit order that earns swap fees while waiting to be filled.',
    ],
  },
  'quiz-7': {
    answers: [1, 1, 1, 1, 1],
    explanations: [
      'Spot concentration uses tight price ranges. When price moves outside, the position earns zero fees and requires rebalancing — high maintenance.',
      'Volatility harvesting profits from price oscillating through your bins. Each crossing generates fees. Works best in choppy, directionless markets.',
      'Never put more than 20% of your portfolio in a single LP position. Diversification protects against smart contract risks and sudden IL.',
      'IL breakeven = days of fee income needed to offset IL from a price move. If fees earn $10/day and 20% move causes $500 IL, breakeven is 50 days.',
      'The flywheel: More LPs → deeper liquidity → less slippage → more traders → more volume/fees → attracts more LPs. Self-reinforcing growth.',
    ],
  },
};

// ── Quiz attempt rate limiting (in-memory, per isolate) ──
const quizAttemptMap = new Map();
const QUIZ_MAX_ATTEMPTS_PER_DAY = 3;

function checkQuizAttempts(ip, quizId) {
  const key = `${ip}:${quizId}`;
  const now = Date.now();
  const entry = quizAttemptMap.get(key);
  const dayMs = 86400000;

  if (!entry || now - entry.start > dayMs) {
    quizAttemptMap.set(key, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= QUIZ_MAX_ATTEMPTS_PER_DAY;
}

// ── Game endpoints handler ──
async function handleGameRoute(path, request, env, origin) {
  if (path === '/game/quiz-submit' && request.method === 'POST') {
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    const body = await request.json();
    const { quizId, answers } = body;

    // Validate quiz exists
    const quiz = QUIZ_ANSWERS[quizId];
    if (!quiz) {
      return new Response(JSON.stringify({ error: 'Invalid quiz ID' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // Rate limit: max 3 attempts per quiz per day per IP
    if (!checkQuizAttempts(clientIp, quizId)) {
      return new Response(JSON.stringify({ error: 'Too many attempts. Try again tomorrow.', retryAfter: '24h' }), {
        status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '86400', ...corsHeaders(origin) },
      });
    }

    // Validate answers array
    if (!Array.isArray(answers) || answers.length !== quiz.answers.length) {
      return new Response(JSON.stringify({ error: 'Invalid answers format' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // Grade the quiz
    const correct = answers.map((a, i) => a === quiz.answers[i]);
    const score = correct.filter(Boolean).length;
    const total = quiz.answers.length;
    const passed = score / total >= 0.7;
    const perfect = score === total;

    return new Response(JSON.stringify({
      passed,
      perfect,
      score,
      total,
      correct,
      correctAnswers: quiz.answers,
      explanations: quiz.explanations,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders(origin) },
    });
  }

  // Placeholder for future game endpoints
  if (path === '/game/leaderboard' && request.method === 'GET') {
    // TODO: Read from KV when available
    return new Response(JSON.stringify({ leaderboard: [], message: 'Leaderboard coming soon' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', ...corsHeaders(origin) },
    });
  }

  if (path.startsWith('/game/award-') && request.method === 'POST') {
    // TODO: Validate + store in KV when available
    return new Response(JSON.stringify({ ok: true, message: 'Recorded' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders(origin) },
    });
  }

  return new Response(JSON.stringify({ error: 'Game route not found' }), {
    status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

// ── AI Market Brief (Claude API) ──
// In-memory cache for market brief (4-hour TTL)
let marketBriefCache = { data: null, timestamp: 0 };
const BRIEF_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

// ── Solana Blinks/Actions handler ──
// Implements the Solana Actions spec (https://docs.dialect.to/documentation/actions/specification)
// Returns ActionGetResponse for GET, handles POST for transaction creation
const SITE_URL = 'https://www.limerscapital.com';

function actionsCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Accept-Encoding',
    'Access-Control-Expose-Headers': 'X-Action-Version, X-Blockchain-Ids',
    'X-Action-Version': '2.1.3',
    'X-Blockchain-Ids': 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
    'Content-Type': 'application/json',
  };
}

async function handleActionsRoute(path, request, env) {
  // OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: actionsCorsHeaders() });
  }

  const actionId = path.replace('/actions/', '').split('/')[0];
  const headers = actionsCorsHeaders();

  // Only GET is needed for Blink preview cards
  if (request.method === 'GET') {
    const actions = {
      learn: {
        type: 'action',
        icon: `${SITE_URL}/og-learn.png`,
        title: 'Learn Crypto — Limer\'s Capital',
        description: 'Master crypto, Caribbean markets & LP strategies. Earn badges, XP, and Limer Points. The Caribbean\'s learn-to-earn Solana platform.',
        label: 'Start Learning',
        links: {
          actions: [
            {
              label: 'Start Learning',
              href: `${SITE_URL}?tab=learn`,
              type: 'external-link',
            },
          ],
        },
      },
      trade: {
        type: 'action',
        icon: `${SITE_URL}/og-trade.png`,
        title: 'Paper Trade on Solana — Limer\'s Capital',
        description: 'Practice trading SOL, USDC, JUP, BONK and more — risk-free. Then swap for real via Jupiter. The Caribbean\'s trading simulator.',
        label: 'Start Trading',
        links: {
          actions: [
            {
              label: 'Paper Trade',
              href: `${SITE_URL}?tab=trade`,
              type: 'external-link',
            },
            {
              label: 'Real Swap (Jupiter)',
              href: `${SITE_URL}?tab=trade&market=jupiter`,
              type: 'external-link',
            },
          ],
        },
      },
      ttse: {
        type: 'action',
        icon: `${SITE_URL}/og-ttse.png`,
        title: 'TTSE Live Stocks — Limer\'s Capital',
        description: 'Trinidad & Tobago Stock Exchange live data on Solana. Track Caribbean equities, simulate tokenized stock trades, and bridge TradFi to DeFi.',
        label: 'View TTSE',
        links: {
          actions: [
            {
              label: 'View TTSE Stocks',
              href: `${SITE_URL}?tab=ttse`,
              type: 'external-link',
            },
          ],
        },
      },
    };

    const action = actions[actionId];
    if (!action) {
      return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 404, headers });
    }

    return new Response(JSON.stringify(action), { status: 200, headers });
  }

  // POST — for future on-chain transaction creation (placeholder)
  if (request.method === 'POST') {
    return new Response(JSON.stringify({
      type: 'external-link',
      externalLink: `${SITE_URL}?tab=${actionId}`,
    }), { status: 200, headers });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
}

async function handleAIRoute(path, request, env, origin) {
  if (path === '/ai/market-brief' && request.method === 'GET') {
    // Check cache first
    const now = Date.now();
    if (marketBriefCache.data && now - marketBriefCache.timestamp < BRIEF_CACHE_TTL) {
      return new Response(JSON.stringify(marketBriefCache.data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
          'X-Cache': 'HIT',
          ...corsHeaders(origin),
        },
      });
    }

    // Fetch live market data to feed Claude
    let marketContext = '';
    try {
      // Fetch SOL price + global market data
      const [solRes, globalRes] = await Promise.allSettled([
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true'),
        fetch('https://api.coingecko.com/api/v3/global'),
      ]);

      if (solRes.status === 'fulfilled') {
        const prices = await solRes.value.json();
        marketContext += `Current prices: SOL $${prices.solana?.usd} (${prices.solana?.usd_24h_change?.toFixed(2)}% 24h), BTC $${prices.bitcoin?.usd} (${prices.bitcoin?.usd_24h_change?.toFixed(2)}% 24h), ETH $${prices.ethereum?.usd} (${prices.ethereum?.usd_24h_change?.toFixed(2)}% 24h). `;
      }

      if (globalRes.status === 'fulfilled') {
        const global = await globalRes.value.json();
        const d = global.data;
        marketContext += `Global crypto market cap: $${(d.total_market_cap?.usd / 1e12).toFixed(2)}T. BTC dominance: ${d.market_cap_percentage?.btc?.toFixed(1)}%. 24h volume: $${(d.total_volume?.usd / 1e9).toFixed(1)}B. `;
      }
    } catch (e) {
      marketContext = 'Market data temporarily unavailable. ';
    }

    // Check for ANTHROPIC_API_KEY
    if (!env.ANTHROPIC_API_KEY) {
      // Return a static brief if no API key configured
      return new Response(JSON.stringify({
        brief: {
          title: 'Caribbean Crypto Market Intelligence',
          date: new Date().toISOString().split('T')[0],
          sentiment: 'neutral',
          bullets: [
            'AI market briefs require API configuration — contact the team to enable live intelligence.',
            marketContext || 'Market data loading...',
          ],
          disclaimer: 'This is not financial advice. Always do your own research.',
        },
        cached: false,
        source: 'fallback',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // Call Claude API (Haiku for speed and cost)
    try {
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-20250414',
          max_tokens: 600,
          messages: [{
            role: 'user',
            content: `You are a Caribbean crypto market analyst for Limer's Capital, a platform focused on Caribbean crypto adoption and the Trinidad & Tobago Stock Exchange (TTSE). Write a concise daily market brief.

Current market data: ${marketContext}

Caribbean context: The region has 22 jurisdictions with varying crypto regulation. The Bahamas has the DARE Act, ECCU countries have the Virtual Asset Business Bill, Jamaica has JAM-DEX CBDC, and T&T has the TTSE (24 listed stocks). Remittances to the Caribbean exceed $20B/year.

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{"title":"Brief title","sentiment":"bullish|bearish|neutral","bullets":["point 1","point 2","point 3","point 4","point 5"],"caribbeanInsight":"One insight specifically about Caribbean crypto adoption or regulation","tradingNote":"One actionable observation for Caribbean traders"}`,
          }],
        }),
      });

      if (!claudeRes.ok) {
        throw new Error(`Claude API error: ${claudeRes.status}`);
      }

      const claudeData = await claudeRes.json();
      const content = claudeData.content?.[0]?.text || '';

      // Parse Claude's response
      let brief;
      try {
        brief = JSON.parse(content);
      } catch {
        // If parsing fails, create a structured response from raw text
        brief = {
          title: 'Caribbean Crypto Market Update',
          sentiment: 'neutral',
          bullets: content.split('\n').filter(l => l.trim()).slice(0, 5),
          caribbeanInsight: 'Caribbean markets continue to evolve with new regulatory frameworks.',
          tradingNote: 'Monitor TTSE alongside crypto markets for diversification opportunities.',
        };
      }

      const result = {
        brief: {
          ...brief,
          date: new Date().toISOString().split('T')[0],
          disclaimer: 'AI-generated analysis. Not financial advice. Always do your own research.',
        },
        cached: false,
        source: 'claude-haiku',
        generatedAt: new Date().toISOString(),
      };

      // Cache the result
      marketBriefCache = { data: result, timestamp: now };

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
          'X-Cache': 'MISS',
          ...corsHeaders(origin),
        },
      });
    } catch (e) {
      return new Response(JSON.stringify({
        error: 'AI service temporarily unavailable',
        fallback: {
          title: 'Market Update',
          date: new Date().toISOString().split('T')[0],
          sentiment: 'neutral',
          bullets: [marketContext || 'Market data loading...'],
          disclaimer: 'AI-generated analysis unavailable. Showing raw market data.',
        },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'AI route not found' }), {
    status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

// ── Allowed upstream routes ──
const ROUTES = {
  // Helius RPC (standard JSON-RPC calls)
  '/rpc': {
    method: 'POST',
    buildUrl: (env) => `https://mainnet.helius-rpc.com/?api-key=${env.HELIUS_API_KEY}`,
    cacheTtl: 0,
    maxBodySize: 5_000,
  },
  // Helius DAS API (getAssetBatch for token metadata)
  '/das': {
    method: 'POST',
    buildUrl: (env) => `https://mainnet.helius-rpc.com/?api-key=${env.HELIUS_API_KEY}`,
    cacheTtl: 300, // 5 min — metadata rarely changes
    maxBodySize: 10_000,
  },
  // CoinGecko market data (proxy to avoid CORS + rate limit sharing)
  '/coingecko/markets': {
    method: 'GET',
    buildUrl: () => 'https://api.coingecko.com/api/v3/coins/markets',
    cacheTtl: 60,
    passQuery: true,
  },
  '/coingecko/simple/price': {
    method: 'GET',
    buildUrl: () => 'https://api.coingecko.com/api/v3/simple/price',
    cacheTtl: 30,
    passQuery: true,
  },
  // DeFiLlama (proxy for consistent caching)
  '/defillama/chains': {
    method: 'GET',
    buildUrl: () => 'https://api.llama.fi/v2/chains',
    cacheTtl: 300,
  },
  '/defillama/protocols': {
    method: 'GET',
    buildUrl: () => 'https://api.llama.fi/protocols',
    cacheTtl: 300,
  },
  '/defillama/yields': {
    method: 'GET',
    buildUrl: () => 'https://yields.llama.fi/pools',
    cacheTtl: 300,
  },
  // Meteora DLMM pools (datapi.meteora.ag — 30 RPS limit)
  '/meteora/dlmm-pools': {
    method: 'GET',
    buildUrl: () => 'https://dlmm.datapi.meteora.ag/pools',
    cacheTtl: 60,
    passQuery: true,
  },
  '/meteora/pool': {
    method: 'GET',
    buildUrl: () => 'https://dlmm.datapi.meteora.ag/pools',
    cacheTtl: 60,
    passQuery: true,
  },
  '/meteora/pool-groups': {
    method: 'GET',
    buildUrl: () => 'https://dlmm.datapi.meteora.ag/pools/groups',
    cacheTtl: 60,
    passQuery: true,
  },
  '/meteora/stats': {
    method: 'GET',
    buildUrl: () => 'https://dlmm.datapi.meteora.ag/stats/protocol_metrics',
    cacheTtl: 300,
  },
};

// ── Allowed JSON-RPC methods (prevent abuse) ──
const ALLOWED_RPC_METHODS = [
  'getAssetBatch',
  'getAsset',
  'getBalance',
  'getTokenAccountsByOwner',
  'getAccountInfo',
  'getLatestBlockhash',
  'getSignaturesForAddress',
  'getTransaction',
  'sendTransaction',
  'simulateTransaction',
  'getRecentPrioritizationFees',
];

async function validateRpcBody(body, maxSize) {
  if (body.length > maxSize) {
    throw new Error('Request body too large');
  }

  const parsed = JSON.parse(body);
  const method = parsed.method;

  if (!method || !ALLOWED_RPC_METHODS.includes(method)) {
    throw new Error(`RPC method "${method}" not allowed`);
  }

  return parsed;
}

// ── Main handler ──
export default {
  async fetch(request, env) {
    // CORS preflight
    const origin = getAllowedOrigin(request, env);

    if (request.method === 'OPTIONS') {
      if (!origin) {
        return new Response('Forbidden', { status: 403 });
      }
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Origin check
    if (!origin) {
      return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Rate limit
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again in 60 seconds.' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          ...corsHeaders(origin),
        },
      });
    }

    // Route matching
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle /game/* routes (quiz validation, LP/XP tracking, leaderboard)
    if (path.startsWith('/game/')) {
      return handleGameRoute(path, request, env, origin);
    }

    // Handle /ai/* routes (Claude API powered intelligence)
    if (path.startsWith('/ai/')) {
      return handleAIRoute(path, request, env, origin);
    }

    // Handle /actions/* routes (Solana Blinks/Actions)
    if (path.startsWith('/actions/')) {
      return handleActionsRoute(path, request, env);
    }

    const route = ROUTES[path];

    if (!route) {
      return new Response(JSON.stringify({ error: 'Not found', availableRoutes: Object.keys(ROUTES) }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    if (request.method !== route.method) {
      return new Response(JSON.stringify({ error: `Method ${request.method} not allowed for ${path}` }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    try {
      // Build upstream URL
      let upstreamUrl = route.buildUrl(env);

      // Pass query parameters for GET requests
      if (route.passQuery && url.search) {
        upstreamUrl += url.search;
      }

      // Build fetch options
      const fetchOpts = {
        method: route.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      };

      // Handle POST body
      if (route.method === 'POST') {
        const body = await request.text();
        await validateRpcBody(body, route.maxBodySize || 10_000);
        fetchOpts.body = body;
      }

      // Edge caching
      if (route.cacheTtl > 0) {
        fetchOpts.cf = { cacheTtl: route.cacheTtl, cacheEverything: true };
      }

      // Fetch upstream
      const upstream = await fetch(upstreamUrl, fetchOpts);
      const responseBody = await upstream.text();

      return new Response(responseBody, {
        status: upstream.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': route.cacheTtl > 0
            ? `public, max-age=${route.cacheTtl}`
            : 'no-store',
          'X-Proxy-Cache-TTL': String(route.cacheTtl),
          ...corsHeaders(origin),
        },
      });
    } catch (err) {
      const status = err.message.includes('not allowed') ? 400 : 500;
      return new Response(JSON.stringify({ error: err.message }), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }
  },
};
