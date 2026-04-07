#!/bin/bash
# ── Limer's Capital — Worker Deployment Script ──
# Deploys both Cloudflare Workers with security hardening.
#
# Usage:
#   cd workers
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Prerequisites:
#   - wrangler installed (npm i -g wrangler)
#   - Authenticated: wrangler login
#   - Helius API key ready

set -e

echo "╔══════════════════════════════════════════════╗"
echo "║  Limer's Capital — Worker Deployment         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# 1. Deploy TTSE proxy (origin-locked)
echo "→ Deploying ttse-proxy (origin-locked CORS)..."
wrangler deploy ttse-proxy.js --name ttse-proxy
echo "  ✅ ttse-proxy deployed"
echo ""

# 2. Deploy API proxy
echo "→ Deploying limer-api-proxy (Helius key stays server-side)..."
wrangler deploy api-proxy.js -c wrangler-api.toml
echo "  ✅ limer-api-proxy deployed"
echo ""

# 3. Set secrets (if not already set)
echo "→ Setting API secrets..."
echo "  (You'll be prompted to paste each key — they won't be echoed)"
echo ""
echo "  [1/3] HELIUS_API_KEY:"
wrangler secret put HELIUS_API_KEY -c wrangler-api.toml
echo "  ✅ HELIUS_API_KEY stored"
echo ""
echo "  [2/3] FMP_API_KEY (Financial Modeling Prep):"
wrangler secret put FMP_API_KEY -c wrangler-api.toml
echo "  ✅ FMP_API_KEY stored"
echo ""
echo "  [3/3] FINNHUB_API_KEY:"
wrangler secret put FINNHUB_API_KEY -c wrangler-api.toml
echo "  ✅ FINNHUB_API_KEY stored"
echo ""

echo "════════════════════════════════════════════════"
echo "Deployment complete. Verify:"
echo ""
echo "  TTSE:  curl https://ttse-proxy.solanacaribbean-team.workers.dev"
echo "  API:   curl https://limer-api-proxy.solanacaribbean-team.workers.dev/rpc"
echo ""
echo "Make sure .env.local has:"
echo "  VITE_API_PROXY_URL=https://limer-api-proxy.solanacaribbean-team.workers.dev"
echo "  VITE_TTSE_PROXY_URL=https://ttse-proxy.solanacaribbean-team.workers.dev"
echo ""
echo "Then rebuild and deploy the SPA:"
echo "  npx vite build && npx wrangler pages deploy dist/"
echo "════════════════════════════════════════════════"
