import { Component } from 'react';
import { captureException } from '../sentry';

/**
 * Sanitize error messages for display — strip sensitive data like
 * API keys, wallet addresses, internal paths, and stack traces.
 */
function sanitizeErrorMessage(error) {
  const raw = error?.message || 'Unknown error';
  let msg = raw
    // Strip API keys / tokens (alphanumeric strings 20+ chars after key-like prefixes)
    .replace(/(?:api[_-]?key|token|secret|password|authorization)[=:\s]+\S+/gi, '[REDACTED]')
    // Strip long hex strings (wallet addresses, tx signatures)
    .replace(/\b[A-Fa-f0-9]{40,}\b/g, '[addr]')
    // Strip base58 Solana addresses (32-44 chars)
    .replace(/\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g, '[addr]')
    // Strip file paths
    .replace(/(?:\/[\w.-]+){3,}/g, '[path]')
    // Strip URLs with query params that might contain keys
    .replace(/https?:\/\/\S*[?&]\S*/g, '[url]');
  // Cap length to avoid leaking verbose internal errors
  if (msg.length > 200) msg = msg.slice(0, 200) + '…';
  return msg;
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log full error to console for debugging (never shown to user)
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Forward to Sentry if configured — no-op if VITE_SENTRY_DSN isn't set.
    captureException(error, {
      contexts: {
        react: { componentStack: errorInfo?.componentStack || '' },
      },
      tags: { source: 'react-error-boundary' },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="font-sans text-[1.2rem] font-bold text-txt mb-2">Something went wrong</h2>
          <p className="text-[.82rem] text-muted mb-1 max-w-md">
            The app encountered an unexpected error. Your data is safe — try reloading the page.
          </p>
          <p className="text-[.68rem] text-muted/60 mb-6 max-w-md font-mono">
            {sanitizeErrorMessage(this.state.error)}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-sea text-night font-sans font-bold text-[.82rem] cursor-pointer border-none transition-all hover:brightness-90">
              Reload Page
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('caribcrypto-storage');
                window.location.reload();
              }}
              className="px-5 py-2.5 rounded-xl bg-transparent border border-border text-muted font-mono text-[.75rem] cursor-pointer transition-all hover:text-txt hover:border-sea/30">
              Reset & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
