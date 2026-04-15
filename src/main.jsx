import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SolanaProvider } from './solana/provider';
import { initSentry } from './sentry';
import './i18n';
import './index.css';

// Initialise error telemetry before React mounts so we capture any crash
// that happens during the first render pass. No-op when VITE_SENTRY_DSN is unset.
initSentry();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SolanaProvider>
      <App />
    </SolanaProvider>
  </React.StrictMode>
);
