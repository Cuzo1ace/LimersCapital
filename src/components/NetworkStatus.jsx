// NetworkStatus — sticky offline banner + stale data warning
// Mounts once in App.jsx, above the header.
import { useState, useEffect } from 'react';

export default function NetworkStatus() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline  = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="sticky top-0 z-[300] w-full flex items-center justify-center gap-2
        text-white text-[.74rem] font-mono font-bold py-1.5 px-4 text-center"
      style={{ background: '#92400E' }}
    >
      <span aria-hidden="true">📡</span>
      <span>You are offline — prices shown are from the last successful refresh</span>
    </div>
  );
}
