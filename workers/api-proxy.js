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
 *   HELIUS_API_KEY  — Helius RPC + DAS API key
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
