/**
 * Sentry bootstrap.
 *
 * Active only when VITE_SENTRY_DSN is set at build time. Without a DSN,
 * this module is a safe no-op — builds and dev work identically to before.
 *
 * What it captures:
 *   - Unhandled errors and promise rejections (automatic)
 *   - React component render errors (via the ErrorBoundary in src/components/ErrorBoundary.jsx)
 *   - Manually flagged issues via Sentry.captureException / captureMessage
 *
 * What it strips before sending:
 *   - Wallet addresses (base58 / hex)
 *   - File paths and URLs with query strings
 *   - Anything longer than 500 chars in a message
 *
 * DSN setup:
 *   1. Create a Sentry project at sentry.io (React platform).
 *   2. Copy the public DSN (https://xxx@oNNN.ingest.sentry.io/NNN).
 *   3. In Cloudflare Pages → Settings → Environment variables, add:
 *        VITE_SENTRY_DSN = <your DSN>
 *   4. Trigger a redeploy. Sentry will start receiving events on the next build.
 */
import * as Sentry from '@sentry/react';

function sanitize(text) {
  if (typeof text !== 'string') return text;
  return text
    // Strip credentials embedded in key/value patterns
    .replace(/(api[_-]?key|token|secret|password|authorization)[=:\s]+\S+/gi, '$1=[REDACTED]')
    // Strip long hex strings (wallet addresses, tx signatures)
    .replace(/\b[A-Fa-f0-9]{40,}\b/g, '[addr]')
    // Strip base58 Solana addresses (32–44 chars)
    .replace(/\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g, '[addr]')
    // Strip query strings from URLs — they may contain keys
    .replace(/(https?:\/\/[^\s?]+)\?\S+/g, '$1')
    // Cap length
    .slice(0, 500);
}

let initialised = false;

export function initSentry() {
  if (initialised) return true;
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    // Not configured — leave Sentry off. Every Sentry.* call becomes a no-op.
    return false;
  }
  try {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE || 'production',
      release: import.meta.env.VITE_GIT_SHA || 'unknown',
      // Keep volume manageable — trace 10% of transactions, full errors.
      tracesSampleRate: 0.1,
      // Replays are opt-in and expensive — only sample on errors.
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0.0, // off until user enables @sentry/replay
      sendDefaultPii: false,
      // Errors we never want to see in Sentry: wallet UX rejections and
      // ResizeObserver spam.
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'Non-Error promise rejection captured',
        'AbortError',
        /user rejected/i,
        /user denied/i,
        /Wallet not connected/i,
      ],
      // Drop events from browser extensions (which we don't control).
      denyUrls: [
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
        /^moz-extension:\/\//i,
      ],
      beforeSend(event) {
        try {
          if (event.message) event.message = sanitize(event.message);
          if (event.exception?.values) {
            for (const ex of event.exception.values) {
              if (ex.value) ex.value = sanitize(ex.value);
            }
          }
          // Never send request URL query strings
          if (event.request?.url) event.request.url = sanitize(event.request.url);
        } catch {
          // Sanitization must never throw — drop the event instead
          return null;
        }
        return event;
      },
    });
    initialised = true;
    return true;
  } catch (err) {
    // Sentry init must never break the app
    // eslint-disable-next-line no-console
    console.warn('[Sentry] init failed — continuing without telemetry', err);
    return false;
  }
}

export function captureException(error, context) {
  try {
    Sentry.captureException(error, context);
  } catch {
    // never throw from capture
  }
}

export function captureMessage(message, level = 'info') {
  try {
    Sentry.captureMessage(message, level);
  } catch {
    // never throw from capture
  }
}

export { Sentry };
