/**
 * Cloudflare Worker — TTSE Live Data Proxy
 *
 * Fetches https://www.stockex.co.tt/market-quote/ and returns the HTML
 * with CORS headers so the SPA can read it directly.
 *
 * Advantages over allorigins.win:
 *   - Self-controlled (no third-party dependency)
 *   - Cloudflare edge cache (cacheTtl: 300) = 5-min TTL, reduces origin hits
 *   - 100k free requests/day on Cloudflare Workers free tier
 *   - Sub-100ms response from nearest Cloudflare PoP
 *
 * Deploy:
 *   cd workers
 *   wrangler deploy ttse-proxy.js --name ttse-proxy
 *
 * After deploy, update VITE_TTSE_PROXY_URL in .env.local:
 *   VITE_TTSE_PROXY_URL=https://ttse-proxy.<your-subdomain>.workers.dev
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const TTSE_URL = 'https://www.stockex.co.tt/market-quote/';

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    try {
      const response = await fetch(TTSE_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; caribcryptomap/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
        },
        // Cache at Cloudflare edge for 5 minutes
        cf: { cacheTtl: 300, cacheEverything: true },
      });

      if (!response.ok) {
        return new Response(`TTSE origin returned ${response.status}`, {
          status: 502,
          headers: CORS_HEADERS,
        });
      }

      const html = await response.text();

      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
          ...CORS_HEADERS,
        },
      });
    } catch (err) {
      return new Response(`Worker error: ${err.message}`, {
        status: 500,
        headers: CORS_HEADERS,
      });
    }
  },
};
