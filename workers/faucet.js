/**
 * Limer's Capital mTTDC devnet faucet.
 *
 * Handles POST /faucet/mttdc requests from the frontend. Gives the
 * requesting wallet 10,000 mTTDC, rate-limited to one claim per wallet
 * per 24 hours via KV (key `faucet:mttdc:<walletPubkey>` → ISO timestamp).
 *
 * Security model
 *   - Origin check is enforced by the caller in api-proxy.js
 *   - Faucet private key is stored as `FAUCET_KEYPAIR_JSON` in Wrangler secrets.
 *     It holds only 50K mTTDC and 0.1 SOL on devnet; compromise = capped loss.
 *   - Rate limit: one claim per wallet per 24h. No per-IP limit on top of
 *     the api-proxy's existing limit.
 *   - 10K mTTDC per claim is fixed. We do not honor a client-side `amount`.
 *
 * Production posture
 *   - This pattern (hot-key in worker env) is acceptable for devnet only.
 *   - For mainnet, replace with an on-chain faucet program that a user
 *     signs against, or a HSM-backed signing service (Turnkey / Fireblocks).
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

// Default devnet RPC endpoint. We fall back to the public api.devnet.solana.com
// only when no Helius key is available — Cloudflare Worker egress IPs are
// rate-limited aggressively by the public endpoint, resulting in sporadic
// 403 "Your IP or provider is blocked" errors. Helius devnet is used at
// request time via `resolveRpcUrl(env)` below.
const PUBLIC_DEVNET_RPC = 'https://api.devnet.solana.com';
const MTTDC_MINT = 'BScyHpzzSC4UoUysx7XUqCpSaKdcgjqvNMjpZcXFTxUM';

/** Pick the best available devnet RPC at request time. */
function resolveRpcUrl(env) {
  if (env.HELIUS_API_KEY) {
    return `https://devnet.helius-rpc.com/?api-key=${env.HELIUS_API_KEY}`;
  }
  return PUBLIC_DEVNET_RPC;
}
const MTTDC_DECIMALS = 6;
const CLAIM_AMOUNT_HUMAN = 10_000n;
const CLAIM_AMOUNT_RAW = CLAIM_AMOUNT_HUMAN * 10n ** BigInt(MTTDC_DECIMALS);
const CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000;  // 24h

// Per-IP daily cap — added 2026-04-18 (audit Backend H-02). The per-wallet
// KV limit alone was bypassable by generating throwaway Solana keypairs
// (free, ~1ms) and claiming from each. 50 fresh wallets = full faucet drain
// in under a minute. Gating by Cloudflare's CF-Connecting-IP costs the
// attacker an IP per 3 claims, which is the actual friction you want.
// KV key expires 24h so the budget self-resets.
const MAX_CLAIMS_PER_IP_PER_DAY = 3;
const IP_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function isValidBase58Pubkey(s) {
  if (typeof s !== 'string') return false;
  if (s.length < 32 || s.length > 44) return false;
  // Quick base58 charset check
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(s)) return false;
  try {
    new PublicKey(s);
    return true;
  } catch {
    return false;
  }
}

// Top-level handler wrapper — converts ANY uncaught exception into a
// structured 500 JSON response. Without this, a thrown error bubbles to
// Cloudflare's generic error 1101 page and the operator has no signal
// about what went wrong. `wrangler tail` shows the same info but this
// keeps the failure mode visible to API callers too.
export async function handleFaucetMttdc(request, env, ctx, corsHeaders) {
  try {
    return await _handleFaucetMttdcInner(request, env, ctx, corsHeaders);
  } catch (err) {
    const msg = String(err?.message || err).slice(0, 300);
    const stack = String(err?.stack || '').slice(0, 800);
    console.error('[faucet] uncaught:', msg, '\n', stack);
    return json(
      {
        error: 'Faucet internal error',
        detail: msg,
        stage: 'uncaught',
        hint: msg.includes('Buffer') || msg.includes('process')
          ? 'Add compatibility_flags = ["nodejs_compat"] to wrangler-api.toml and redeploy'
          : msg.includes('WebSocket') || msg.includes('ws://') || msg.includes('wss://')
            ? 'WebSocket subscription path hit — should be using HTTP polling'
            : undefined,
      },
      500,
      corsHeaders,
    );
  }
}

async function _handleFaucetMttdcInner(request, env, ctx, corsHeaders) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, corsHeaders);
  }

  // Parse + validate body
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400, corsHeaders);
  }
  const walletAddress = body?.walletAddress;
  if (!isValidBase58Pubkey(walletAddress)) {
    return json({ error: 'Invalid walletAddress' }, 400, corsHeaders);
  }

  // ── Rate limit via KV ────────────────────────────────────────────
  if (!env.GAME_STATE) {
    return json({ error: 'Faucet not configured (GAME_STATE KV missing)' }, 500, corsHeaders);
  }

  // Per-IP daily cap (audit Backend H-02). Check BEFORE per-wallet so a
  // single attacker running a keypair-generation loop eats IP budget
  // before incrementing wallet-level state. CF-Connecting-IP is set by
  // the Cloudflare edge and cannot be spoofed by direct worker hits.
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipKey = `faucet:ip:${clientIp}`;
  const ipCountRaw = await env.GAME_STATE.get(ipKey);
  const ipCount = ipCountRaw ? parseInt(ipCountRaw, 10) || 0 : 0;
  if (ipCount >= MAX_CLAIMS_PER_IP_PER_DAY) {
    return json(
      {
        error: `Rate limit: max ${MAX_CLAIMS_PER_IP_PER_DAY} claims per IP per 24h`,
        claimsUsed: ipCount,
        retryAfterHuman: '~24h',
      },
      429,
      corsHeaders,
    );
  }

  // Per-wallet cap — kept as secondary layer so fresh IP + repeat wallet
  // still gets a clear error (rather than a confusing on-chain revert).
  const rlKey = `faucet:mttdc:${walletAddress}`;
  const lastClaimIso = await env.GAME_STATE.get(rlKey);
  if (lastClaimIso) {
    const elapsed = Date.now() - Date.parse(lastClaimIso);
    if (elapsed < CLAIM_COOLDOWN_MS) {
      const retryAfterMs = CLAIM_COOLDOWN_MS - elapsed;
      const retryAfterHours = Math.ceil(retryAfterMs / 3_600_000);
      return json(
        {
          error: 'Rate limit: one claim per wallet per 24h',
          lastClaimAt: lastClaimIso,
          retryAfterMs,
          retryAfterHuman: `~${retryAfterHours}h`,
        },
        429,
        corsHeaders,
      );
    }
  }

  // ── Load faucet keypair (with detailed error reporting) ─────────
  if (!env.FAUCET_KEYPAIR_JSON) {
    return json({ error: 'Faucet keypair not configured' }, 500, corsHeaders);
  }
  let faucet;
  try {
    // Gracefully handle the case where a dashboard paste double-quoted the
    // array: "\"[1,2,...]\"". One extra JSON.parse unwraps that.
    let raw = env.FAUCET_KEYPAIR_JSON;
    let parsed = JSON.parse(raw);
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    if (!Array.isArray(parsed) || parsed.length !== 64) {
      return json(
        {
          error: 'Faucet keypair invalid: expected 64-element number array',
          parsedType: Array.isArray(parsed) ? `array(length=${parsed.length})` : typeof parsed,
        },
        500,
        corsHeaders,
      );
    }
    faucet = Keypair.fromSecretKey(Uint8Array.from(parsed));
  } catch (err) {
    return json(
      {
        error: 'Faucet keypair parse failed',
        detail: String(err?.message || err).slice(0, 200),
      },
      500,
      corsHeaders,
    );
  }

  // ── Build + send tx ──────────────────────────────────────────────
  // NOTE: Cloudflare Workers do not support WebSocket subscriptions used by
  // @solana/web3.js's default confirmTransaction. We use HTTP polling via
  // getSignatureStatuses instead. Works over fetch, which Workers do support.
  //
  // Also: the public api.devnet.solana.com rate-limits Worker egress IPs
  // with 403s. resolveRpcUrl() returns Helius devnet if HELIUS_API_KEY is
  // present, falling back to public only as a last resort.
  const rpcUrl = resolveRpcUrl(env);
  // Diagnostic log removed 2026-04-18 (audit Backend M-02). Key length leaks
  // bind-state recon to any wrangler-tail observer. Add a structured
  // Sentry breadcrumb instead if you need to track which RPC is used.
  const connection = new Connection(rpcUrl, 'confirmed');
  const recipient = new PublicKey(walletAddress);
  const mint = new PublicKey(MTTDC_MINT);

  const faucetAta = await getAssociatedTokenAddress(mint, faucet.publicKey);
  const recipientAta = await getAssociatedTokenAddress(mint, recipient);

  const tx = new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(
      faucet.publicKey,  // payer
      recipientAta,
      recipient,
      mint,
      TOKEN_PROGRAM_ID,
    ),
    createTransferInstruction(
      faucetAta,
      recipientAta,
      faucet.publicKey,
      CLAIM_AMOUNT_RAW,
      [],
      TOKEN_PROGRAM_ID,
    ),
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.feePayer = faucet.publicKey;
  tx.sign(faucet);

  let signature;
  try {
    signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    // Poll getSignatureStatuses (HTTP only — no WebSockets).
    // Confirm within ~30s or return a "pending" 202 so the user can re-check.
    let confirmed = false;
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      const statuses = await connection.getSignatureStatuses([signature]);
      const s = statuses?.value?.[0];
      if (s && (s.confirmationStatus === 'confirmed' || s.confirmationStatus === 'finalized')) {
        if (s.err) {
          return json(
            {
              error: 'Faucet tx landed but reverted on-chain',
              signature,
              detail: JSON.stringify(s.err).slice(0, 200),
            },
            502,
            corsHeaders,
          );
        }
        confirmed = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 1500));
    }

    if (!confirmed) {
      // Tx was sent but hasn't confirmed in our polling window. Return 202 so
      // the client knows to check later rather than re-submit (which would
      // race the blockhash and fail anyway). Don't mark rate limit.
      return json(
        {
          status: 'pending',
          signature,
          message: 'Submitted. Confirmation taking longer than expected — check Solscan.',
          solscanUrl: `https://solscan.io/tx/${signature}?cluster=devnet`,
        },
        202,
        corsHeaders,
      );
    }
  } catch (err) {
    return json(
      {
        error: 'Faucet send failed',
        detail: String(err?.message || err).slice(0, 200),
        // Include a hint when Workers runtime throws a recognizable error
        hint: String(err?.message || '').includes('fetch')
          ? 'Check that nodejs_compat flag is set in wrangler-api.toml'
          : undefined,
      },
      502,
      corsHeaders,
    );
  }

  // Mark rate limit now that the send succeeded. Expire the KV key after
  // cooldown so it self-cleans. Increment both per-wallet timestamp and
  // per-IP counter (audit Backend H-02).
  await Promise.all([
    env.GAME_STATE.put(rlKey, new Date().toISOString(), {
      expirationTtl: Math.ceil(CLAIM_COOLDOWN_MS / 1000),
    }),
    env.GAME_STATE.put(ipKey, String(ipCount + 1), {
      expirationTtl: Math.ceil(IP_COOLDOWN_MS / 1000),
    }),
  ]);

  return json(
    {
      success: true,
      walletAddress,
      recipientAta: recipientAta.toBase58(),
      amountHuman: Number(CLAIM_AMOUNT_HUMAN),
      amountRaw: CLAIM_AMOUNT_RAW.toString(),
      mint: MTTDC_MINT,
      txSignature: signature,
      solscanUrl: `https://solscan.io/tx/${signature}?cluster=devnet`,
      nextClaimAt: new Date(Date.now() + CLAIM_COOLDOWN_MS).toISOString(),
    },
    200,
    corsHeaders,
  );
}
