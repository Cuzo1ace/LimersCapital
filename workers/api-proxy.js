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
 *   HELIUS_API_KEY        — Helius RPC + DAS API key
 *   ANTHROPIC_API_KEY     — Claude API key for AI market briefs
 *   FINNHUB_API_KEY       — Finnhub financial data API key
 *   FMP_API_KEY           — Financial Modeling Prep API key
 *   COINGECKO_API_KEY     — CoinGecko Demo tier (30 rpm, 10k/month).
 *                           Injected via x-cg-demo-api-key header on all
 *                           /coingecko/* routes. Absence degrades gracefully
 *                           to the anonymous 30-rpm pooled limit.
 *   SENTRY_DSN            — Error telemetry (audit C-02)
 *   FAUCET_KEYPAIR_JSON   — Devnet faucet signer (64-int JSON array) for
 *                           /faucet/mttdc. Holds 50K mTTDC + 0.1 SOL; devnet only.
 *
 * Deploy:
 *   cd workers
 *   wrangler secret put HELIUS_API_KEY
 *   wrangler deploy api-proxy.js --name limer-api-proxy
 */

import { handleFaucetMttdc } from './faucet.js';
import { fetchArkHoldings, ARK_ETFS } from '../src/api/adapters/arkAdapter.js';
import { fetchIsharesHoldings, ISHARES_ETFS } from '../src/api/adapters/isharesAdapter.js';
import { TERMINAL_TOOLS, SYSTEM_PROMPT } from '../src/api/terminalTools.js';
import { mockQuote, mockOverview, mockDaily, mockMacro, mockMicro, mockOnChainFlows } from '../src/api/marketDataMock.js';
import { mockHoldings } from '../src/api/etfHoldingsMock.js';
import { computeExposure, SUPPORTED_ETFS } from '../src/api/etfOverlap.js';

// ── Allowed origins ──
const ALLOWED_ORIGINS = [
  'https://www.limerscapital.com',
  'https://limerscapital.com',
  'https://caribcryptomap.pages.dev',     // legacy Pages project (Direct Upload, deprecated)
  'https://limerscapital.pages.dev',      // new Git-connected Pages project (primary)
];

// Pattern allowlist — matches any subdomain of these roots. Used for
// per-commit Pages preview URLs (e.g. 6c1b370d.limerscapital.pages.dev).
// Without this, each new deploy's preview URL gets CORS-blocked when
// devs try to smoke-test before merging.
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/[a-z0-9]+\.limerscapital\.pages\.dev$/i,
];

// Dev origins — only allowed when ENVIRONMENT !== 'production'.
// Originally these were permitted in prod "so devs can test the deployed
// Worker from localhost" — revoked 2026-04-18 (audit finding Backend H-03)
// because an attacker running a phishing page on localhost:5173 (or a DNS-
// rebound domain pointing at 127.0.0.1) could issue requests with
// Origin: http://localhost:5173 and get past CORS. Unused API budget
// (Anthropic, Finnhub) could then be burned at zero attacker cost.
// Devs who need to hit the deployed worker from localhost should point
// at a staging worker with ENVIRONMENT != "production" in its vars.
const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5199',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5199',
];

function getAllowedOrigin(request, env) {
  const origin = request.headers.get('Origin') || '';
  // Exact-match allowlist. Dev origins only in non-production environments.
  const allOrigins = env.ENVIRONMENT === 'production'
    ? ALLOWED_ORIGINS
    : [...ALLOWED_ORIGINS, ...DEV_ORIGINS];
  if (allOrigins.includes(origin)) return origin;
  // Subdomain pattern match for Pages preview URLs.
  if (ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin))) return origin;
  return null;
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

let lastRateLimitCleanup = Date.now();
const RATE_LIMIT_CLEANUP_INTERVAL = 5 * 60_000; // 5 minutes
const RATE_LIMIT_MAX_ENTRIES = 10_000;

function cleanupRateLimitMap() {
  const now = Date.now();
  if (now - lastRateLimitCleanup < RATE_LIMIT_CLEANUP_INTERVAL) return;
  lastRateLimitCleanup = now;

  // Purge expired entries to prevent unbounded memory growth
  for (const [key, entry] of rateLimitMap) {
    if (now - entry.start > RATE_LIMIT_WINDOW * 2) {
      rateLimitMap.delete(key);
    }
  }

  // Hard cap: if still too large, clear everything (safety valve)
  if (rateLimitMap.size > RATE_LIMIT_MAX_ENTRIES) {
    rateLimitMap.clear();
  }
}

function checkRateLimit(ip) {
  cleanupRateLimitMap();
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

// ── Circuit-breaker fallback cache ────────────────────────────────────
// When an upstream API returns 4xx/5xx or throws, we serve the last-known-good
// successful response from the Workers Cache API with a 1-hour TTL. This
// decouples the site from transient upstream failures (e.g., the Jupiter
// Price API v2 deprecation incident in April 2026). POST/RPC routes are
// never fallback-cached — state-changing requests must never replay stale data.
const FALLBACK_CACHE_TTL = 3600; // 1 hour
const FALLBACK_CACHE_HOST = 'https://limer-fallback.internal';

function fallbackCacheKey(path, search) {
  return new Request(`${FALLBACK_CACHE_HOST}${path}${search || ''}`, { method: 'GET' });
}

async function readFallback(path, search) {
  try {
    const key = fallbackCacheKey(path, search);
    const hit = await caches.default.match(key);
    if (!hit) return null;
    return await hit.text();
  } catch {
    return null;
  }
}

async function writeFallback(ctx, path, search, body) {
  try {
    const key = fallbackCacheKey(path, search);
    const resp = new Response(body, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${FALLBACK_CACHE_TTL}`,
      },
    });
    // Fire-and-forget so we don't block the response to the caller
    ctx.waitUntil(caches.default.put(key, resp));
  } catch {
    // never block the request path on cache write failures
  }
}

// ── Minimal Sentry reporter (zero deps) ───────────────────────────────
// Posts errors to the Sentry ingestion API via fetch. Active only when
// SENTRY_DSN is set in the worker env. Parsing: https://<key>@<host>/<project>
function parseSentryDsn(dsn) {
  const m = typeof dsn === 'string' && dsn.match(/^https:\/\/([^@]+)@([^/]+)\/(\d+)$/);
  if (!m) return null;
  return { publicKey: m[1], host: m[2], projectId: m[3] };
}

function sanitizeForSentry(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/(api[_-]?key|token|secret|password|authorization)[=:\s]+\S+/gi, '$1=[REDACTED]')
    .replace(/\b[A-Fa-f0-9]{40,}\b/g, '[addr]')
    .replace(/\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g, '[addr]')
    .slice(0, 500);
}

async function reportToSentry(ctx, env, error, extra) {
  try {
    const dsn = env?.SENTRY_DSN;
    if (!dsn) return;
    const parsed = parseSentryDsn(dsn);
    if (!parsed) return;
    const { publicKey, host, projectId } = parsed;
    const url = `https://${host}/api/${projectId}/store/`;
    const payload = {
      event_id: crypto.randomUUID().replace(/-/g, ''),
      timestamp: new Date().toISOString(),
      platform: 'javascript',
      level: 'error',
      environment: env.ENVIRONMENT || 'production',
      release: env.RELEASE || `limer-api-proxy@${env.ENVIRONMENT || 'unknown'}`,
      server_name: 'limer-api-proxy',
      tags: {
        source: 'cloudflare-worker',
        worker: 'limer-api-proxy',
      },
      exception: {
        values: [
          {
            type: (error && error.name) || 'Error',
            value: sanitizeForSentry(String((error && error.message) || error || 'unknown')),
          },
        ],
      },
      extra: Object.fromEntries(
        Object.entries(extra || {}).map(([k, v]) => [
          k,
          typeof v === 'string' ? sanitizeForSentry(v) : v,
        ]),
      ),
    };
    const req = fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=limer-worker/1.0`,
      },
      body: JSON.stringify(payload),
    }).catch(() => {});
    if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(req);
  } catch {
    // Sentry reporting must never take down a request
  }
}

// ── CSP violation report handler (audit C-03) ─────────────────────────
// Accepts POST /csp-report from browsers emitting Content-Security-Policy
// violations. Supports both CSP v1 (`application/csp-report`) and CSP v3
// Reporting API (`application/reports+json`) payloads. Forwards each report
// to Sentry tagged `source: 'csp-report'` so violations surface in the same
// dashboard as runtime errors.
//
// This endpoint intentionally skips the ALLOWED_ORIGINS check because many
// browsers send CSP reports without an Origin header. IP-level rate limiting
// still applies to deter abuse. Payloads are capped at 16KB to deter fill
// attacks on Sentry ingest.
async function handleCspReport(request, env, ctx) {
  const MAX_BYTES = 16 * 1024;
  try {
    const contentType = (request.headers.get('Content-Type') || '').toLowerCase();
    const raw = await request.text();
    if (raw.length > MAX_BYTES) {
      return new Response(null, { status: 413 });
    }

    let reports = [];
    if (contentType.includes('application/reports+json')) {
      // CSP v3 Reporting API: body is an array of { type, age, url, body: {...} }
      const parsed = JSON.parse(raw);
      reports = Array.isArray(parsed) ? parsed : [parsed];
    } else {
      // CSP v1: body is { "csp-report": { ... } }
      const parsed = JSON.parse(raw);
      const r = parsed && parsed['csp-report'] ? parsed['csp-report'] : parsed;
      reports = [{ type: 'csp-violation', body: r }];
    }

    for (const report of reports) {
      const body = (report && report.body) || report || {};
      const blockedUri =
        body['blocked-uri'] || body.blockedURL || body.blockedURI || 'unknown';
      const violatedDirective =
        body['violated-directive'] || body.effectiveDirective || body.violatedDirective || 'unknown';
      const documentUri =
        body['document-uri'] || body.documentURL || body.documentURI || 'unknown';
      const sourceFile =
        body['source-file'] || body.sourceFile || '';
      const disposition = body.disposition || 'report';

      await reportToSentry(
        ctx,
        env,
        new Error(`CSP ${disposition}: ${violatedDirective}`),
        {
          kind: 'csp-report',
          blockedUri: String(blockedUri).slice(0, 512),
          violatedDirective: String(violatedDirective).slice(0, 256),
          documentUri: String(documentUri).slice(0, 512),
          sourceFile: String(sourceFile).slice(0, 512),
          disposition,
          userAgent: (request.headers.get('User-Agent') || '').slice(0, 256),
          clientIp: request.headers.get('CF-Connecting-IP') || 'unknown',
        },
      );
    }
  } catch {
    // Never 500 on malformed reports — browsers retry aggressively.
  }
  return new Response(null, { status: 204 });
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
  'quiz-8': {
    answers: [1, 1, 1, 1, 1],
    explanations: [
      'UBO means every user who learns, trades, or contributes becomes an owner of the platform — not just a customer. Ownership is earned through participation.',
      'Distributing revenue in stablecoins (USDC) and SOL gives holders real purchasing power without creating sell pressure on the native $LIMER token.',
      'Dynamic NFTs in Limer\'s model are yield-bearing — their on-chain metadata tracks accrued revenue, vesting schedules, and governance weight. They\'re financial instruments, not art.',
      'Premium tier unlocks Wam integration, ViFi yield streams, pro analytics, boosted LP rewards, early access to features, and benefits that grow as the platform scales.',
      'Caribbean populations have limited access to traditional equity markets and brokerages. DeFi protocols on Solana serve anyone with a phone — no minimums, no foreign brokerage, no barriers.',
    ],
  },
};

// ── Quiz attempt rate limiting (in-memory, per isolate) ──
const quizAttemptMap = new Map();
const QUIZ_MAX_ATTEMPTS_PER_DAY = 3;
let lastQuizCleanup = Date.now();

function checkQuizAttempts(ip, quizId) {
  const key = `${ip}:${quizId}`;
  const now = Date.now();
  const dayMs = 86400000;

  // Periodic cleanup — purge expired quiz entries
  if (now - lastQuizCleanup > 3600_000) { // every hour
    lastQuizCleanup = now;
    for (const [k, v] of quizAttemptMap) {
      if (now - v.start > dayMs) quizAttemptMap.delete(k);
    }
  }

  const entry = quizAttemptMap.get(key);

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
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    const awardType = path.includes('award-lp') ? 'lp' : 'xp';

    // Rate limit: max 30 award calls per minute per IP (prevents spam)
    const awardKey = `${clientIp}:award-${awardType}`;
    const now = Date.now();
    const awardEntry = rateLimitMap.get(awardKey);
    if (awardEntry && now - awardEntry.start < 60_000 && awardEntry.count > 30) {
      return new Response(JSON.stringify({ error: 'Too many award requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60', ...corsHeaders(origin) },
      });
    }
    if (!awardEntry || now - awardEntry.start > 60_000) {
      rateLimitMap.set(awardKey, { start: now, count: 1 });
    } else {
      awardEntry.count++;
    }

    // Validate body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    const { action, amount } = body;

    // Validate action type
    const VALID_ACTIONS = ['trade', 'lesson', 'quiz', 'badge', 'checkin', 'challenge', 'insight', 'knowledge', 'micro-lesson', 'journal'];
    if (!action || !VALID_ACTIONS.includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action type' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // Validate amount is a reasonable number (prevents inflated scores)
    const MAX_AWARD = awardType === 'lp' ? 500 : 1000;
    if (typeof amount !== 'number' || amount <= 0 || amount > MAX_AWARD || !Number.isFinite(amount)) {
      return new Response(JSON.stringify({ error: `Invalid ${awardType.toUpperCase()} amount (max ${MAX_AWARD})` }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }

    // TODO: Store validated amount in KV when available
    return new Response(JSON.stringify({ ok: true, message: 'Recorded', validated: true }), {
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

  // ── Dynamic "exposure" Blink — shareable regional-portfolio card ──
  // Query params: caribbean, us_equity, us_etf, crypto, fixed_income,
  // other, total (dollars), label (optional short tag). All percentages
  // are floats 0–100. The Blink renders a native card in Phantom /
  // Twitter / Dialect whenever a user pastes the URL — CTA opens the
  // Terminal so recipients can upload their own book.
  if (actionId === 'exposure' && request.method === 'GET') {
    const url = new URL(request.url);
    const num = (k, d = 0) => {
      const v = parseFloat(url.searchParams.get(k));
      return Number.isFinite(v) ? v : d;
    };
    const parts = {
      caribbean:    num('caribbean'),
      us_equity:    num('us_equity'),
      us_etf:       num('us_etf'),
      crypto:       num('crypto'),
      fixed_income: num('fixed_income'),
      other:        num('other'),
    };
    const total = num('total');
    const ordered = Object.entries(parts)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a);
    const summary = ordered
      .map(([k, v]) => `${k.replace('_', ' ')} ${v.toFixed(1)}%`)
      .join(' · ');
    const headline = parts.caribbean > 25 ? 'Regionally anchored Caribbean book'
      : parts.caribbean > 0 ? 'US-tilted with Caribbean sleeve'
      : 'Global-market book';
    return new Response(JSON.stringify({
      type: 'action',
      icon: `${SITE_URL}/og-terminal.png`,
      title: `My Terminal · ${headline}`,
      description: `${summary}${total ? ` · $${total.toLocaleString()}` : ''}\n\nUpload your own portfolio to see your true exposure — SPY, QQQ, ARKK and iShares flattened into single-name positions, Caribbean vs US lens, Monte Carlo on demand.`,
      label: 'See your own exposure',
      links: {
        actions: [
          { label: 'Open Terminal', href: `${SITE_URL}?tab=terminal`, type: 'external-link' },
          { label: 'Learn about Limer\'s', href: `${SITE_URL}?tab=learn`, type: 'external-link' },
        ],
      },
    }), { status: 200, headers });
  }

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
      // Fetch SOL price + global market data (authed with CG demo key when set)
      const cgAuth = env.COINGECKO_API_KEY
        ? { headers: { 'x-cg-demo-api-key': env.COINGECKO_API_KEY } }
        : undefined;
      const [solRes, globalRes] = await Promise.allSettled([
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana,bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true', cgAuth),
        fetch('https://api.coingecko.com/api/v3/global', cgAuth),
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

  if (path === '/ai/terminal-chat') {
    return handleTerminalChat(request, env, origin);
  }

  return new Response(JSON.stringify({ error: 'AI route not found' }), {
    status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// Terminal AI chat — Claude tool-use loop streamed over SSE.
// Client posts { messages, portfolioSnapshot }. We append a system prompt,
// run the agent loop (tool calls executed locally), and emit SSE events:
//   event: text    — assistant text delta
//   event: tool    — tool call / tool result boundary
//   event: done    — stream complete
// ═══════════════════════════════════════════════════════════════════════

export async function executeTerminalTool(name, input, ctx) {
  const snap = ctx?.portfolioSnapshot || [];
  switch (name) {
    case 'get_portfolio':
      return { positions: snap };

    case 'get_quote':
      return mockQuote(input?.symbol) || { error: `Unknown symbol: ${input?.symbol}` };

    case 'get_price_history': {
      const days = Math.min(500, Math.max(5, Number(input?.days) || 90));
      return { symbol: input?.symbol, history: mockDaily(input?.symbol, days) };
    }

    case 'compute_overlap': {
      const holdingsMap = {};
      const symbols = [...new Set(snap.map(p => String(p.symbol || '').toUpperCase()))];
      for (const s of symbols) {
        const h = mockHoldings(s);
        if (h) holdingsMap[s] = h;
      }
      const { total, rows } = computeExposure(snap, holdingsMap);
      return { total, top: rows.slice(0, 15) };
    }

    case 'run_monte_carlo': {
      const quote = mockQuote(input?.symbol);
      if (!quote) return { error: `Unknown symbol: ${input?.symbol}` };
      // Simple analytical summary: compute quantiles from 500 sim paths
      // in-worker (fast enough) without streaming the full fan.
      const days  = Math.min(1260, Math.max(5,  Number(input?.horizonDays) || 252));
      const paths = Math.min(5000, Math.max(50, Number(input?.numPaths)    || 1000));
      const mu = 0.08, sigma = quote.sector === 'Crypto' ? 0.80 : 0.30;
      const dt = 1 / 252;
      const drift = (mu - 0.5 * sigma * sigma) * dt;
      const volStep = sigma * Math.sqrt(dt);
      const finals = new Float64Array(paths);
      for (let p = 0; p < paths; p++) {
        let price = quote.price;
        for (let t = 1; t < days; t++) {
          let u = Math.random(); while (u === 0) u = Math.random();
          const v = Math.random();
          const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
          price = price * Math.exp(drift + volStep * z);
        }
        finals[p] = price;
      }
      finals.sort();
      const q = (frac) => finals[Math.floor(paths * frac)];
      const mean = finals.reduce((s, v) => s + v, 0) / paths;
      return {
        symbol: input.symbol,
        startPrice: quote.price,
        horizonDays: days,
        numPaths: paths,
        mean, p5: q(0.05), p50: q(0.50), p95: q(0.95),
        min: finals[0], max: finals[paths - 1],
      };
    }

    case 'compare_tickers': {
      const syms = (input?.symbols || []).slice(0, 6);
      return { rows: syms.map(s => ({ symbol: s, ...(mockOverview(s) || { error: 'unknown' }) })) };
    }

    case 'get_macro_indicator': {
      const m = mockMacro()[String(input?.indicator || '').toUpperCase()];
      return m || { error: `Unknown indicator: ${input?.indicator}` };
    }

    case 'get_on_chain_flow':
      return mockOnChainFlows();

    case 'search_news':
      return { results: [], note: 'Live news wiring pending — returns empty until news provider is configured.' };

    case 'submit_paper_trade': {
      const { side, symbol, qty, price } = input || {};
      const q = mockQuote(symbol);
      if (!q) return { error: `Unknown symbol: ${symbol}` };
      const fill = price || q.price;
      return {
        accepted: true,
        fill: { side, symbol, qty, price: fill, total: fill * qty, paper: true },
        note: 'Paper trade only. Add to paper ledger in client.',
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

async function handleTerminalChat(request, env, origin) {
  if (request.method !== 'POST') {
    return jsonRes({ error: 'Method not allowed' }, 405, origin);
  }
  if (!env.ANTHROPIC_API_KEY) {
    return jsonRes({ error: 'ANTHROPIC_API_KEY not configured' }, 503, origin);
  }

  let payload = {};
  try { payload = await request.json(); }
  catch { return jsonRes({ error: 'Invalid JSON' }, 400, origin); }

  const userMessages = Array.isArray(payload.messages) ? payload.messages : [];
  const snap = Array.isArray(payload.portfolioSnapshot) ? payload.portfolioSnapshot : [];
  if (userMessages.length === 0) {
    return jsonRes({ error: 'messages required' }, 400, origin);
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const sse = (event, data) => controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      try {
        let conversation = [...userMessages];
        const maxIterations = 6;

        for (let iter = 0; iter < maxIterations; iter++) {
          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 1200,
              system: SYSTEM_PROMPT,
              tools: TERMINAL_TOOLS,
              messages: conversation,
            }),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => '');
            sse('error', { error: `Anthropic ${res.status}`, detail: errText.slice(0, 400) });
            break;
          }
          const data = await res.json();
          const contentBlocks = data.content || [];

          // Stream text blocks; collect tool_use blocks for execution.
          const toolUses = [];
          for (const b of contentBlocks) {
            if (b.type === 'text' && b.text) {
              sse('text', { text: b.text });
            } else if (b.type === 'tool_use') {
              toolUses.push(b);
              sse('tool', { phase: 'call', name: b.name, input: b.input });
            }
          }

          if (data.stop_reason !== 'tool_use' || toolUses.length === 0) {
            break;  // Done — no further tools requested.
          }

          // Append assistant + tool_result turn, then loop.
          conversation = [
            ...conversation,
            { role: 'assistant', content: contentBlocks },
            {
              role: 'user',
              content: await Promise.all(toolUses.map(async tu => {
                const result = await executeTerminalTool(tu.name, tu.input, { portfolioSnapshot: snap });
                sse('tool', { phase: 'result', name: tu.name, result });
                return {
                  type: 'tool_result',
                  tool_use_id: tu.id,
                  content: JSON.stringify(result),
                };
              })),
            },
          ];
        }

        sse('done', { ok: true });
      } catch (err) {
        controller.enqueue(new TextEncoder().encode(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store',
      'Connection': 'keep-alive',
      ...corsHeaders(origin),
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// Terminal dashboard routes — Alpha Vantage, Artemis, Flipside, ETF
// holdings (ARK + iShares), and the nightly /cron/etf-refresh job.
// Phase 2 of the premium Terminal build. All routes gracefully degrade
// to a "not configured" body when the relevant secret is missing so the
// worker never 500s in environments where only a subset of providers
// are enabled.
// ═══════════════════════════════════════════════════════════════════════

function jsonRes(body, status, origin, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
      ...extraHeaders,
    },
  });
}

// ── Alpha Vantage ─────────────────────────────────────────────────────
// Free tier = 5 req/min. We edge-cache 60s per (fn,symbol) to stay safe.

const AV_FUNCTIONS = {
  quote:    { av: 'GLOBAL_QUOTE',       param: 'symbol', cache: 30 },
  daily:    { av: 'TIME_SERIES_DAILY',  param: 'symbol', cache: 600 },
  overview: { av: 'OVERVIEW',           param: 'symbol', cache: 3600 },
  econ:     { av: null,                 param: 'indicator', cache: 3600 }, // indicator is the function name
};

async function handleAlphaVantageRoute(path, request, env, origin) {
  if (request.method !== 'GET') {
    return jsonRes({ error: 'Method not allowed' }, 405, origin);
  }
  if (!env.ALPHAVANTAGE_API_KEY) {
    return jsonRes({ error: 'Alpha Vantage not configured' }, 503, origin);
  }
  const fn = path.replace(/^\/alpha-vantage\//, '').split('/')[0];
  const cfg = AV_FUNCTIONS[fn];
  if (!cfg) return jsonRes({ error: `Unknown AV function: ${fn}` }, 400, origin);

  const url = new URL(request.url);
  const paramVal = url.searchParams.get(cfg.param);
  if (!paramVal) return jsonRes({ error: `Missing ?${cfg.param}` }, 400, origin);

  // Safety whitelist pattern: only ASCII letters, digits, underscore.
  if (!/^[A-Za-z0-9_]{1,32}$/.test(paramVal)) {
    return jsonRes({ error: 'Invalid parameter' }, 400, origin);
  }

  const avFn = cfg.av || paramVal.toUpperCase();   // econ uses indicator as function
  const upstream = new URL('https://www.alphavantage.co/query');
  upstream.searchParams.set('function', avFn);
  if (cfg.av)  upstream.searchParams.set(cfg.param, paramVal.toUpperCase());
  if (fn === 'econ') upstream.searchParams.set('interval', 'monthly');
  if (fn === 'daily') upstream.searchParams.set('outputsize', url.searchParams.get('outputsize') === 'full' ? 'full' : 'compact');
  upstream.searchParams.set('apikey', env.ALPHAVANTAGE_API_KEY);

  const r = await fetch(upstream.toString(), {
    cf: { cacheTtl: cfg.cache, cacheEverything: true },
  });
  const body = await r.text();
  return new Response(body, {
    status: r.status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${cfg.cache}`,
      ...corsHeaders(origin),
    },
  });
}

// ── Artemis ───────────────────────────────────────────────────────────

async function handleArtemisRoute(path, request, env, origin) {
  if (request.method !== 'GET') return jsonRes({ error: 'Method not allowed' }, 405, origin);
  if (!env.ARTEMIS_API_KEY)     return jsonRes({ error: 'Artemis not configured' }, 503, origin);

  const sub = path.replace(/^\/artemis\//, '');
  // Safety: alphanumeric + dashes + slashes (Artemis API paths).
  if (!/^[A-Za-z0-9/_\-.]+$/.test(sub) || sub.length > 200) {
    return jsonRes({ error: 'Invalid artemis subpath' }, 400, origin);
  }
  const url = new URL(request.url);
  const upstream = new URL(`https://api.artemisxyz.com/${sub}`);
  for (const [k, v] of url.searchParams) upstream.searchParams.set(k, v);
  upstream.searchParams.set('APIKey', env.ARTEMIS_API_KEY);

  const r = await fetch(upstream.toString(), {
    cf: { cacheTtl: 1800, cacheEverything: true },
  });
  const body = await r.text();
  return new Response(body, {
    status: r.status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=1800',
      ...corsHeaders(origin),
    },
  });
}

// ── Flipside (async SQL) ──────────────────────────────────────────────
// Stateless pattern: client POSTs SQL, gets a jobId, then polls. We use
// the v2 /api/v2/queries endpoint. Requires FLIPSIDE_JOBS KV binding.

async function handleFlipsideRoute(path, request, env, origin) {
  if (!env.FLIPSIDE_API_KEY) return jsonRes({ error: 'Flipside not configured' }, 503, origin);

  if (path === '/flipside/query' && request.method === 'POST') {
    let payload = {};
    try { payload = await request.json(); } catch { return jsonRes({ error: 'Invalid JSON' }, 400, origin); }
    const sql = String(payload.sql || '');
    if (sql.length < 10 || sql.length > 20_000) return jsonRes({ error: 'SQL length invalid' }, 400, origin);
    // Basic safety: read-only keyword enforcement.
    if (!/^\s*(with|select)\b/i.test(sql) || /;\s*(drop|delete|update|insert|truncate|alter)\b/i.test(sql)) {
      return jsonRes({ error: 'Only read-only SQL allowed' }, 400, origin);
    }
    const r = await fetch('https://api-v2.flipsidecrypto.xyz/json-rpc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.FLIPSIDE_API_KEY,
      },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'createQueryRun',
        params: [{ resultTTLHours: 1, maxAgeMinutes: 60, sql, tags: { source: 'limer-terminal' }, dataSource: 'snowflake-default', dataProvider: 'flipside' }],
      }),
    });
    const data = await r.json().catch(() => ({}));
    const jobId = data?.result?.queryRun?.id;
    if (!jobId) return jsonRes({ error: 'Flipside createQueryRun failed', upstream: data }, 502, origin);
    if (env.FLIPSIDE_JOBS) {
      await env.FLIPSIDE_JOBS.put(jobId, '1', { expirationTtl: 3600 });
    }
    return jsonRes({ jobId }, 200, origin);
  }

  if (path === '/flipside/poll' && request.method === 'GET') {
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId') || '';
    if (!/^[A-Za-z0-9\-_]{8,64}$/.test(jobId)) return jsonRes({ error: 'Invalid jobId' }, 400, origin);
    // Status
    const statusRes = await fetch('https://api-v2.flipsidecrypto.xyz/json-rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': env.FLIPSIDE_API_KEY },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getQueryRun', params: [{ queryRunId: jobId }] }),
    });
    const statusJson = await statusRes.json().catch(() => ({}));
    const state = statusJson?.result?.queryRun?.state; // QUERY_STATE_{READY,RUNNING,SUCCESS,FAILED,CANCELED}
    if (state === 'QUERY_STATE_SUCCESS') {
      const rowsRes = await fetch('https://api-v2.flipsidecrypto.xyz/json-rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': env.FLIPSIDE_API_KEY },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getQueryRunResults', params: [{ queryRunId: jobId, format: 'json', page: { number: 1, size: 1000 } }] }),
      });
      const rowsJson = await rowsRes.json().catch(() => ({}));
      return jsonRes({ status: 'succeeded', rows: rowsJson?.result?.rows || [] }, 200, origin);
    }
    if (state === 'QUERY_STATE_FAILED' || state === 'QUERY_STATE_CANCELED') {
      return jsonRes({ status: 'failed', error: statusJson?.result?.queryRun?.errorMessage || state }, 200, origin);
    }
    return jsonRes({ status: 'running' }, 200, origin);
  }

  return jsonRes({ error: 'Flipside route not found' }, 404, origin);
}

// ── ETF holdings (ARK + iShares) ──────────────────────────────────────
// Served from R2 cache (populated by /cron/etf-refresh). If the cached
// blob is missing, we fetch upstream once and backfill. Adapters are
// imported at the top of this file.

async function loadHoldings(env, source, symbol) {
  const key = `etf/${source}/${symbol}.json`;
  if (env.ETF_CACHE) {
    const cached = await env.ETF_CACHE.get(key, { type: 'json' });
    if (cached) return { cached: true, data: cached };
  }
  // Miss → upstream fetch + backfill.
  const data = source === 'ark'
    ? await fetchArkHoldings(symbol)
    : await fetchIsharesHoldings(symbol);
  if (env.ETF_CACHE) {
    await env.ETF_CACHE.put(key, JSON.stringify(data), {
      httpMetadata: { contentType: 'application/json' },
    });
  }
  return { cached: false, data };
}

async function handleEtfHoldingsRoute(path, request, env, origin) {
  if (request.method !== 'GET') return jsonRes({ error: 'Method not allowed' }, 405, origin);
  const [, source, kind, rawSymbol] = path.split('/');  // /ark/holdings/ARKK
  if (kind !== 'holdings' || !rawSymbol) {
    return jsonRes({ error: 'Usage: /<source>/holdings/<SYMBOL>' }, 400, origin);
  }
  const symbol = rawSymbol.toUpperCase();
  const registry = source === 'ark' ? ARK_ETFS : ISHARES_ETFS;
  if (!registry.includes(symbol)) {
    return jsonRes({ error: `Unsupported ${source} ETF: ${symbol}`, allowed: registry }, 400, origin);
  }
  try {
    const { cached, data } = await loadHoldings(env, source, symbol);
    return jsonRes(data, 200, origin, {
      'Cache-Control': 'public, max-age=3600',
      'X-ETF-Cache': cached ? 'HIT' : 'MISS',
    });
  } catch (err) {
    return jsonRes({ error: err.message }, 502, origin);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MCP endpoint (Model Context Protocol — streamable HTTP transport).
// External Claude agents register this with:
//   claude mcp add --transport http terminal <url> --header "x-api-key: <KEY>"
// Tools are the shared TERMINAL_TOOLS set; execution hits the same
// executeTerminalTool() path as the built-in chat drawer.
//
// For MVP, auth is a per-user API key validated against Supabase
// `users.mcp_api_key`. If Supabase isn't configured, we fall back to a
// shared DEV_MCP_KEY env var so the endpoint can be exercised locally.
// ═══════════════════════════════════════════════════════════════════════

async function validateMcpKey(env, key) {
  if (!key) return { ok: false, reason: 'missing key' };
  if (env.DEV_MCP_KEY && key === env.DEV_MCP_KEY) return { ok: true, wallet: 'dev' };
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { ok: false, reason: 'supabase unavailable' };
  }
  const r = await fetch(
    `${env.SUPABASE_URL}/rest/v1/users?select=wallet_address,tier&mcp_api_key=eq.${encodeURIComponent(key)}`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  if (!r.ok) return { ok: false, reason: `supabase ${r.status}` };
  const arr = await r.json().catch(() => []);
  const row = arr?.[0];
  if (!row) return { ok: false, reason: 'unknown key' };
  if (row.tier !== 'pro') return { ok: false, reason: 'not pro tier' };
  return { ok: true, wallet: row.wallet_address };
}

async function handleMcpTerminal(request, env, origin) {
  if (request.method !== 'POST') {
    return jsonRes({ error: 'Method not allowed — POST JSON-RPC' }, 405, origin);
  }
  const keyHeader = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  const auth = await validateMcpKey(env, keyHeader);
  if (!auth.ok) {
    return jsonRes({ error: `MCP auth failed: ${auth.reason}` }, 401, origin);
  }

  let body;
  try { body = await request.json(); }
  catch { return jsonRes({ error: 'Invalid JSON' }, 400, origin); }

  const id = body?.id ?? null;
  const method = body?.method;
  const params = body?.params || {};

  const rpcOk  = (result) => jsonRes({ jsonrpc: '2.0', id, result }, 200, origin);
  const rpcErr = (code, message) => jsonRes({ jsonrpc: '2.0', id, error: { code, message } }, 200, origin);

  switch (method) {
    case 'initialize':
      return rpcOk({
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'limer-terminal-mcp', version: '0.1.0' },
        capabilities: { tools: { listChanged: false } },
      });

    case 'tools/list':
      return rpcOk({
        tools: TERMINAL_TOOLS.map(t => ({
          name: t.name,
          description: t.description,
          inputSchema: t.input_schema,
        })),
      });

    case 'tools/call': {
      const { name, arguments: args } = params;
      if (!name) return rpcErr(-32602, 'tools/call requires a tool name');
      try {
        const result = await executeTerminalTool(name, args || {}, { portfolioSnapshot: [] });
        return rpcOk({
          content: [{ type: 'text', text: JSON.stringify(result) }],
          isError: !!result?.error,
        });
      } catch (e) {
        return rpcErr(-32000, `tool ${name} failed: ${e.message}`);
      }
    }

    case 'ping':
      return rpcOk({});

    default:
      return rpcErr(-32601, `Method not found: ${method}`);
  }
}

// ── Cron: /cron/etf-refresh ────────────────────────────────────────────
// Triggered nightly by `crons = ["0 6 * * *"]` in wrangler config, or
// manually via GET /cron/etf-refresh (authenticated with CRON_KEY).

async function handleCronRoute(path, request, env, origin) {
  if (path !== '/cron/etf-refresh') return jsonRes({ error: 'Unknown cron' }, 404, origin);

  // Require shared secret for manual invocation — the scheduled handler
  // (worker scheduled() export) calls this internally with the header set.
  const providedKey = request.headers.get('x-cron-key') || '';
  if (!env.CRON_KEY || providedKey !== env.CRON_KEY) {
    return jsonRes({ error: 'Forbidden' }, 403, origin);
  }

  const results = { ark: [], ishares: [] };
  for (const sym of ARK_ETFS) {
    try {
      const data = await fetchArkHoldings(sym);
      if (env.ETF_CACHE) {
        await env.ETF_CACHE.put(`etf/ark/${sym}.json`, JSON.stringify(data));
      }
      results.ark.push({ sym, rows: data.rows.length });
    } catch (e) {
      results.ark.push({ sym, error: e.message });
    }
  }
  for (const sym of ISHARES_ETFS) {
    try {
      const data = await fetchIsharesHoldings(sym);
      if (env.ETF_CACHE) {
        await env.ETF_CACHE.put(`etf/ishares/${sym}.json`, JSON.stringify(data));
      }
      results.ishares.push({ sym, rows: data.rows.length });
    } catch (e) {
      results.ishares.push({ sym, error: e.message });
    }
  }
  return jsonRes({ ok: true, refreshedAt: new Date().toISOString(), results }, 200, origin);
}

// ── FMP ticker whitelist (audit finding M-06) ──
// These are the exact underlying symbols used by the basis-spread widget in
// src/pages/MarketPage.jsx, driven by `underlying:` fields in the token
// catalog at src/data/tokenCatalog.js. Keep this list in sync when adding a
// new tokenized stock / ETF / commodity / currency. Any symbol not in this
// set is rejected at the worker before the upstream fetch, defending the
// FMP free-tier 250 req/day budget against random-symbol DoS.
//
// To extend: add the `underlying` string from tokenCatalog.js and deploy the
// worker.  Unknown tickers return HTTP 400 with a clear error so callers can
// distinguish a whitelist miss from an upstream outage.
const FMP_SYMBOL_WHITELIST = new Set([
  // US equities — Backed xStocks
  'AAPL', 'AMZN', 'TSLA', 'NVDA', 'MSFT', 'GOOGL',
  // US equity ETFs
  'SPY', 'QQQ', 'VTI', 'IWM',
  // Short-duration treasuries (Ondo Global Markets)
  'OUSG', 'USTB', 'TBILL',
  // Precious metals
  'XAG',
  // Forex (settled as USD pairs on FMP /stable/quote)
  'EUR', 'GBP',
]);

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
  // CoinGecko market data. Demo-tier key injected via extraHeaders when
  // COINGECKO_API_KEY is set; falls back to the pooled anonymous limit
  // otherwise. Auth moves us from 30 rpm shared to 30 rpm per-key plus
  // the 10k/month monthly cap — the high cacheTtl is what actually keeps
  // us under the monthly budget, see plan §rate-limit math.
  '/coingecko/markets': {
    method: 'GET',
    buildUrl: () => 'https://api.coingecko.com/api/v3/coins/markets',
    extraHeaders: (env) => env.COINGECKO_API_KEY ? { 'x-cg-demo-api-key': env.COINGECKO_API_KEY } : {},
    cacheTtl: 300,
    passQuery: true,
  },
  '/coingecko/global': {
    method: 'GET',
    buildUrl: () => 'https://api.coingecko.com/api/v3/global',
    extraHeaders: (env) => env.COINGECKO_API_KEY ? { 'x-cg-demo-api-key': env.COINGECKO_API_KEY } : {},
    cacheTtl: 600,
  },
  '/coingecko/trending': {
    method: 'GET',
    buildUrl: () => 'https://api.coingecko.com/api/v3/search/trending',
    extraHeaders: (env) => env.COINGECKO_API_KEY ? { 'x-cg-demo-api-key': env.COINGECKO_API_KEY } : {},
    cacheTtl: 300,
  },
  '/coingecko/categories-list': {
    method: 'GET',
    buildUrl: () => 'https://api.coingecko.com/api/v3/coins/categories/list',
    extraHeaders: (env) => env.COINGECKO_API_KEY ? { 'x-cg-demo-api-key': env.COINGECKO_API_KEY } : {},
    cacheTtl: 3600,
  },
  // Dynamic-id routes: the coin id arrives as ?id=<slug>. The validate()
  // hook rejects anything outside the CoinGecko id charset, so a path like
  // ?id=../foo can't traverse into other upstream endpoints.
  '/coingecko/coin': {
    method: 'GET',
    buildUrl: (env, url) => {
      const id = url.searchParams.get('id');
      // Strip id= so it doesn't tail onto the upstream URL. Remaining query
      // params (localization, tickers, community_data, developer_data) are
      // forwarded via passQuery.
      const rest = new URLSearchParams(url.searchParams);
      rest.delete('id');
      const qs = rest.toString();
      return `https://api.coingecko.com/api/v3/coins/${id}${qs ? '?' + qs : ''}`;
    },
    extraHeaders: (env) => env.COINGECKO_API_KEY ? { 'x-cg-demo-api-key': env.COINGECKO_API_KEY } : {},
    cacheTtl: 600,
    passQuery: false,
    validate: (url) => {
      const id = url.searchParams.get('id');
      if (!id || !/^[a-z0-9-]+$/.test(id)) {
        return { error: 'Invalid or missing id param (must match /^[a-z0-9-]+$/)', status: 400 };
      }
      return null;
    },
  },
  '/coingecko/market-chart': {
    method: 'GET',
    buildUrl: (env, url) => {
      const id = url.searchParams.get('id');
      const rest = new URLSearchParams(url.searchParams);
      rest.delete('id');
      const qs = rest.toString();
      return `https://api.coingecko.com/api/v3/coins/${id}/market_chart${qs ? '?' + qs : ''}`;
    },
    extraHeaders: (env) => env.COINGECKO_API_KEY ? { 'x-cg-demo-api-key': env.COINGECKO_API_KEY } : {},
    cacheTtl: 600,
    passQuery: false,
    validate: (url) => {
      const id = url.searchParams.get('id');
      if (!id || !/^[a-z0-9-]+$/.test(id)) {
        return { error: 'Invalid or missing id param (must match /^[a-z0-9-]+$/)', status: 400 };
      }
      return null;
    },
  },
  '/coingecko/ohlc': {
    method: 'GET',
    buildUrl: (env, url) => {
      const id = url.searchParams.get('id');
      const rest = new URLSearchParams(url.searchParams);
      rest.delete('id');
      const qs = rest.toString();
      return `https://api.coingecko.com/api/v3/coins/${id}/ohlc${qs ? '?' + qs : ''}`;
    },
    extraHeaders: (env) => env.COINGECKO_API_KEY ? { 'x-cg-demo-api-key': env.COINGECKO_API_KEY } : {},
    cacheTtl: 600,
    passQuery: false,
    validate: (url) => {
      const id = url.searchParams.get('id');
      if (!id || !/^[a-z0-9-]+$/.test(id)) {
        return { error: 'Invalid or missing id param (must match /^[a-z0-9-]+$/)', status: 400 };
      }
      return null;
    },
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

  // ── Jupiter Price API v3 (proxy to avoid CORS) ──
  // Note: v2 on api.jup.ag was deprecated and now returns 404/503. Use v3 on
  // the free-tier host. Response shape also changed: flat { [mint]: {...} }
  // with `usdPrice` instead of the old { data: { [mint]: { price } } }.
  '/jupiter/price': {
    method: 'GET',
    buildUrl: () => 'https://lite-api.jup.ag/price/v3',
    cacheTtl: 30,
    passQuery: true,
  },
  // ── Jupiter Token List (proxy to avoid CORS + long edge cache) ──
  // Used by src/data/tokenCatalog.js fetchDynamicCatalog to auto-discover
  // new xStocks / RWAs / ETFs / tokens without requiring a redeploy. The
  // catalog falls back to the static seed if this route errors out (the
  // circuit breaker deployed in 8868d18 serves last-known-good automatically).
  //
  // Jupiter migrated the token list API from tokens.jup.ag → lite-api.jup.ag
  // (same host migration as the price API fix in 200fb09). The v2 endpoint
  // takes a `query` param for the tag filter:
  //   /jupiter/token-list?query=verified        → ~6 MB verified token set
  //   /jupiter/token-list?query=lst             → liquid staking tokens
  //   /jupiter/token-list?query=xstocks         → (if tagged) xStocks
  '/jupiter/token-list': {
    method: 'GET',
    buildUrl: () => 'https://lite-api.jup.ag/tokens/v2/tag',
    cacheTtl: 3600, // 1 hour — token list changes slowly
    passQuery: true,
  },

  // ── Finnhub Financial Data (API key injected server-side) ──
  '/finnhub/economic-calendar': {
    method: 'GET',
    buildUrl: (env) => `https://finnhub.io/api/v1/calendar/economic?token=${env.FINNHUB_API_KEY}`,
    cacheTtl: 600,
    passQuery: true,
  },
  // ── Finnhub real-time quote for a single ticker ──
  // NOTE: requires FINNHUB_API_KEY secret to be set on the worker. If not set
  // the endpoint returns 401 "Invalid API key." and the frontend gracefully
  // hides the basis-spread widget. Kept as an optional fallback data source.
  '/finnhub/quote': {
    method: 'GET',
    buildUrl: (env) => `https://finnhub.io/api/v1/quote?token=${env.FINNHUB_API_KEY}`,
    cacheTtl: 60,
    passQuery: true,
  },
  // ── FMP real-time stable quote for a single ticker ──
  // Used by the basis-spread widget to show NASDAQ/NYSE underlying prices
  // next to the on-chain Solana prices of Backed xStocks and Ondo Global
  // Markets tokens. FMP migrated to /stable/ in Aug 2025; the legacy /api/v3
  // endpoints return 403. `?symbol=AAPL` replaces the old path-based form.
  // Example: /fmp/quote?symbol=AAPL → {symbol,price,change,changePercentage,...}
  // FMP free tier: 250 req/day; 60s cache + ~10 tickers = ~144 req/day, safe.
  // The FMP_API_KEY is already set on the worker (same secret that powers
  // /fmp/cryptocurrency-list), so this route is live immediately.
  //
  // Audit finding M-06 — the free-tier budget is undefended against abuse:
  // an adversary sending random `?symbol=XYZ` requests could exhaust 250
  // req/day at near-zero cost. Mitigation: whitelist only the exact tickers
  // present in `src/data/tokenCatalog.js` (see FMP_SYMBOL_WHITELIST below).
  // Any request for an unknown symbol is rejected upstream of the fetch.
  '/fmp/quote': {
    method: 'GET',
    validate: (url) => {
      const symbol = (url.searchParams.get('symbol') || '').replace(/[^A-Z0-9.^-]/gi, '');
      if (!symbol) {
        return { status: 400, error: 'symbol query parameter required' };
      }
      if (!FMP_SYMBOL_WHITELIST.has(symbol)) {
        return { status: 400, error: `symbol not in whitelist: ${symbol}` };
      }
      return null;
    },
    buildUrl: (env, url) => {
      const symbol = (url.searchParams.get('symbol') || '').replace(/[^A-Z0-9.^-]/gi, '');
      return `https://financialmodelingprep.com/stable/quote?symbol=${symbol}&apikey=${env.FMP_API_KEY}`;
    },
    cacheTtl: 60,
    passQuery: false, // symbol already baked into the upstream URL
  },
  '/finnhub/earnings': {
    method: 'GET',
    buildUrl: (env) => `https://finnhub.io/api/v1/calendar/earnings?token=${env.FINNHUB_API_KEY}`,
    cacheTtl: 600,
    passQuery: true,
  },
  '/finnhub/news': {
    method: 'GET',
    buildUrl: (env) => `https://finnhub.io/api/v1/news?token=${env.FINNHUB_API_KEY}`,
    cacheTtl: 300,
    passQuery: true,
  },
  '/finnhub/company-news': {
    method: 'GET',
    buildUrl: (env) => `https://finnhub.io/api/v1/company-news?token=${env.FINNHUB_API_KEY}`,
    cacheTtl: 300,
    passQuery: true,
  },
  '/finnhub/congressional-trading': {
    method: 'GET',
    buildUrl: (env) => `https://finnhub.io/api/v1/stock/congressional-trading?token=${env.FINNHUB_API_KEY}`,
    cacheTtl: 600,
    passQuery: true,
  },
  '/finnhub/insider-transactions': {
    method: 'GET',
    buildUrl: (env) => `https://finnhub.io/api/v1/stock/insider-transactions?token=${env.FINNHUB_API_KEY}`,
    cacheTtl: 600,
    passQuery: true,
  },
  '/finnhub/news-sentiment': {
    method: 'GET',
    buildUrl: (env) => `https://finnhub.io/api/v1/news-sentiment?token=${env.FINNHUB_API_KEY}`,
    cacheTtl: 300,
    passQuery: true,
  },
  '/finnhub/recommendation': {
    method: 'GET',
    buildUrl: (env) => `https://finnhub.io/api/v1/stock/recommendation?token=${env.FINNHUB_API_KEY}`,
    cacheTtl: 600,
    passQuery: true,
  },
  '/finnhub/price-target': {
    method: 'GET',
    buildUrl: (env) => `https://finnhub.io/api/v1/stock/price-target?token=${env.FINNHUB_API_KEY}`,
    cacheTtl: 600,
    passQuery: true,
  },
  '/finnhub/profile': {
    method: 'GET',
    buildUrl: (env) => `https://finnhub.io/api/v1/stock/profile2?token=${env.FINNHUB_API_KEY}`,
    cacheTtl: 86400,
    passQuery: true,
  },
  '/finnhub/metric': {
    method: 'GET',
    buildUrl: (env) => `https://finnhub.io/api/v1/stock/metric?token=${env.FINNHUB_API_KEY}`,
    cacheTtl: 3600,
    passQuery: true,
  },

  // ── Financial Modeling Prep (API key injected server-side) ──
  '/fmp/cryptocurrency-list': {
    method: 'GET',
    buildUrl: (env) => `https://financialmodelingprep.com/stable/cryptocurrency-list?apikey=${env.FMP_API_KEY}`,
    cacheTtl: 3600, // 1 hour — supply data changes infrequently
  },
};

// ── Allowed JSON-RPC methods (prevent abuse) ──
// sendTransaction removed 2026-04-18 (audit finding Backend H-04): frontend
// never sends transactions through this proxy — wallet adapters go direct to
// the RPC for signing + broadcast. Leaving it on the allowlist let any
// caller past the origin check burn your paid Helius `sendTransaction`
// quota by pre-signing and replaying junk txs. If future code needs a
// server-side send path, put it on its own route with a KV-backed 5/min/IP
// rate limit and a body-shape validator.
//
// simulateTransaction stays — Jupiter pre-flight simulation uses it at
// src/components/JupiterSwap.jsx:131. Consider adding a 2/min/IP cap if
// the audit M-05 upgrade to Cloudflare Rate Limiting Rules lands.
const ALLOWED_RPC_METHODS = [
  'getAssetBatch',
  'getAsset',
  'getBalance',
  'getTokenAccountsByOwner',
  'getAccountInfo',
  'getLatestBlockhash',
  'getSignaturesForAddress',
  'getTransaction',
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
  async fetch(request, env, ctx) {
    // Parse URL up-front so routes that bypass the origin check (e.g. CSP
    // reports — browsers do not send Origin on report POSTs) can match first.
    const url = new URL(request.url);
    const path = url.pathname;

    // ── Unauthenticated endpoints ────────────────────────────────────────
    // /csp-report accepts violation reports from any origin (per audit C-03).
    // Rate-limit by IP to deter abuse; no Origin allowlist check.
    if (path === '/csp-report') {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
      }
      const reporterIp = request.headers.get('CF-Connecting-IP') || 'unknown';
      if (!checkRateLimit(reporterIp)) {
        return new Response(null, { status: 429, headers: { 'Retry-After': '60' } });
      }
      return handleCspReport(request, env, ctx);
    }

    // /actions/* — Solana Blinks are public endpoints by spec. Phantom,
    // Dialect, Twitter and other Action-capable clients fetch the manifest
    // server-side (often without an Origin header), so they cannot pass the
    // allowlist. The handler sets Access-Control-Allow-Origin: * on its
    // own responses via actionsCorsHeaders(); rate-limiting still applies.
    if (path.startsWith('/actions/')) {
      const reporterIp = request.headers.get('CF-Connecting-IP') || 'unknown';
      if (!checkRateLimit(reporterIp)) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
        });
      }
      return handleActionsRoute(path, request, env);
    }

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

    // Handle /game/* routes (quiz validation, LP/XP tracking, leaderboard)
    if (path.startsWith('/game/')) {
      return handleGameRoute(path, request, env, origin);
    }

    // Handle /ai/* routes (Claude API powered intelligence)
    if (path.startsWith('/ai/')) {
      return handleAIRoute(path, request, env, origin);
    }

    // ── Terminal dashboard routes (Phase 2) ───────────────────────────
    if (path.startsWith('/alpha-vantage/')) return handleAlphaVantageRoute(path, request, env, origin);
    if (path.startsWith('/artemis/'))       return handleArtemisRoute(path, request, env, origin);
    if (path.startsWith('/flipside/'))      return handleFlipsideRoute(path, request, env, origin);
    if (path.startsWith('/ark/') || path.startsWith('/ishares/')) {
      return handleEtfHoldingsRoute(path, request, env, origin);
    }
    if (path.startsWith('/cron/'))          return handleCronRoute(path, request, env, origin);
    if (path === '/mcp/terminal' || path === '/mcp/terminal/')
                                             return handleMcpTerminal(request, env, origin);

    // Handle /faucet/mttdc — devnet mTTDC faucet (Phase B5)
    if (path === '/faucet/mttdc') {
      return handleFaucetMttdc(request, env, ctx, corsHeaders(origin));
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

    // Optional per-route validation hook (audit M-06 FMP whitelist, etc).
    // Runs before any upstream fetch so we can reject abuse at near-zero cost.
    if (typeof route.validate === 'function') {
      const validation = route.validate(url);
      if (validation) {
        return new Response(JSON.stringify({ error: validation.error }), {
          status: validation.status || 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });
      }
    }

    // Circuit breaker applies ONLY to safe GET routes. POST/RPC must never
    // replay stale data (state-changing operations).
    const circuitEligible = route.method === 'GET';

    try {
      // Build upstream URL. Pass `url` as a second arg so routes with
      // dynamic upstream paths (e.g. FMP's /quote/{symbols}) can read query
      // params without needing passQuery.
      let upstreamUrl = route.buildUrl(env, url);

      // Pass query parameters for GET requests
      if (route.passQuery && url.search) {
        upstreamUrl += url.search;
      }

      // Build fetch options. Per-route extraHeaders(env) lets authed upstreams
      // (e.g. CoinGecko Demo key) inject their headers without a branch here.
      const extraHeaders = typeof route.extraHeaders === 'function' ? route.extraHeaders(env) : {};
      const fetchOpts = {
        method: route.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...extraHeaders,
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

      // ── Circuit breaker ─────────────────────────────────────
      // On a healthy 2xx GET response, record it as the last-known-good
      // fallback. On a 5xx (or the 404/4xx shapes that Cloudflare sometimes
      // wraps upstream timeouts in), try to serve the previous good body.
      if (circuitEligible && upstream.ok) {
        writeFallback(ctx, path, url.search, responseBody);
      } else if (circuitEligible && !upstream.ok) {
        const fallbackBody = await readFallback(path, url.search);
        if (fallbackBody) {
          // Fire-and-forget Sentry breadcrumb so we know the breaker engaged
          reportToSentry(ctx, env, new Error('upstream-failure-served-stale'), {
            path,
            upstream_status: upstream.status,
            stale: true,
          });
          return new Response(fallbackBody, {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store',
              'X-Limer-Circuit': 'open',
              'X-Upstream-Status': String(upstream.status),
              ...corsHeaders(origin),
            },
          });
        }
        // No fallback available — report the raw upstream failure
        reportToSentry(ctx, env, new Error('upstream-failure-no-fallback'), {
          path,
          upstream_status: upstream.status,
          body_preview: responseBody?.slice(0, 200),
        });
      }

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
      // Network error / fetch threw / validation failure.
      // For GET routes, try to serve the last-known-good body before giving up.
      if (circuitEligible) {
        const fallbackBody = await readFallback(path, url.search);
        if (fallbackBody) {
          reportToSentry(ctx, env, err, { path, stale: true, error_type: 'fetch_threw' });
          return new Response(fallbackBody, {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store',
              'X-Limer-Circuit': 'open',
              'X-Upstream-Status': 'fetch-error',
              ...corsHeaders(origin),
            },
          });
        }
      }
      reportToSentry(ctx, env, err, { path, error_type: 'fetch_threw' });
      const status = err.message.includes('not allowed') ? 400 : 500;
      return new Response(JSON.stringify({ error: err.message }), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    }
  },

  // Scheduled Cron Trigger — refresh ETF holdings nightly.
  // Configured via `[[triggers.crons]]` in wrangler-api.toml.
  async scheduled(event, env, ctx) {
    if (!env.CRON_KEY) return;
    const req = new Request('https://internal/cron/etf-refresh', {
      headers: { 'x-cron-key': env.CRON_KEY, Origin: 'https://limerscapital.com' },
    });
    // Origin is allowlisted so corsHeaders() resolves. The handler guards
    // on x-cron-key so exposure is limited even if someone hits it directly.
    ctx.waitUntil(handleCronRoute('/cron/etf-refresh', req, env, 'https://limerscapital.com'));
  },
};
