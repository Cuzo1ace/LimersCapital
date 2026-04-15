import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SolanaProvider } from './solana/provider';
import { initSentry, captureException, captureMessage } from './sentry';
import { getDynamicCatalog } from './data/tokenCatalog';
import './i18n';
import './index.css';

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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SolanaProvider>
      <App />
    </SolanaProvider>
  </React.StrictMode>
);
