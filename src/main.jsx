import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SolanaProvider } from './solana/provider';
import ErrorBoundary from './components/ErrorBoundary';
import { initSentry, captureException, captureMessage } from './sentry';
import { getDynamicCatalog } from './data/tokenCatalog';
import './i18n';
import './index.css';

// ── /?reset=1 recovery path ───────────────────────────────────────────
// One-click nuke for users stuck on a stale SW or corrupted localStorage.
// Runs before any other module state so a broken import doesn't block it.
if (typeof window !== 'undefined' && window.location.search.includes('reset=1')) {
  (async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if (typeof caches !== 'undefined') {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      try { localStorage.clear(); } catch {}
      try { sessionStorage.clear(); } catch {}
    } catch {}
    window.location.replace('/');
  })();
} else {
  // Early global error listeners — captures bootstrap crashes that happen
  // before React ever mounts (import-time throws, top-level promise rejections).
  // Without this, affected users have no telemetry; we just know "blank page".
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (e) => {
      try { captureException(e.error || new Error(e.message), { tags: { source: 'window.error' } }); } catch {}
    });
    window.addEventListener('unhandledrejection', (e) => {
      try { captureException(e.reason || new Error('unhandledrejection'), { tags: { source: 'unhandledrejection' } }); } catch {}
    });
  }

  // Initialise error telemetry before React mounts so we capture any crash
  // that happens during the first render pass. No-op when VITE_SENTRY_DSN is unset.
  initSentry();

  // Fire the dynamic catalog fetch in the background. The app renders
  // immediately with the static seed; if Jupiter's verified token list can be
  // reached, the fetch populates a merged catalog for consumers that opt in
  // via `getDynamicCatalog()`. Purely additive — nothing blocks on this.
  getDynamicCatalog()
    .then((result) => {
      if (result?.error) {
        captureMessage(`dynamic-catalog: fallback to seed (${result.error})`, 'warning');
      } else if (result?.dynamicAdded > 0) {
        // eslint-disable-next-line no-console
        console.info(`[catalog] dynamic-catalog: +${result.dynamicAdded} tokens from Jupiter verified list`);
      }
    })
    .catch((err) => {
      captureException(err, { tags: { source: 'dynamic-catalog-boot' } });
    });

  // Mount React inside a try/catch — if creation or the initial render throws
  // synchronously, we at least replace the fallback with a readable message
  // and a working reset link instead of leaving a black page.
  try {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <SolanaProvider>
            <App />
          </SolanaProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (err) {
    try { captureException(err, { tags: { source: 'react-mount' } }); } catch {}
    const el = document.getElementById('root');
    if (el) {
      el.innerHTML =
        '<div style="position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0d0e10;color:#fdfbfe;font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:24px;text-align:center">' +
          '<div style="font-size:40px;margin-bottom:8px">⚠️</div>' +
          '<div style="font-size:15px;font-weight:600;margin-bottom:6px">Couldn\u2019t start the app</div>' +
          '<div style="font-size:13px;opacity:.65;max-width:420px;margin-bottom:20px">This is usually a stale cached build. Clearing it should fix it.</div>' +
          '<a href="/?reset=1" style="padding:10px 18px;border-radius:12px;background:#6ee7b7;color:#0d0e10;font-weight:700;font-size:13px;text-decoration:none">Clear cache &amp; reload</a>' +
        '</div>';
    }
  }
}
