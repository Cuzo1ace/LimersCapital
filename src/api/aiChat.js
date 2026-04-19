/**
 * SSE client for /ai/terminal-chat.
 *
 * Events emitted by the server:
 *   text  — { text }                   (assistant delta)
 *   tool  — { phase, name, input, result }
 *   done  — { ok }
 *   error — { error }
 *
 * Usage:
 *   const stop = streamChat({ messages, portfolioSnapshot, onEvent });
 *   ... later ...
 *   stop();   // aborts the fetch
 */
const PROXY = (import.meta.env.VITE_API_PROXY_URL || '').replace(/\/$/, '');

export function streamChat({ messages, portfolioSnapshot, onEvent }) {
  if (!PROXY) {
    onEvent?.({ type: 'error', error: 'VITE_API_PROXY_URL not configured' });
    return () => {};
  }
  const abort = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${PROXY}/ai/terminal-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, portfolioSnapshot }),
        signal: abort.signal,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        onEvent?.({ type: 'error', error: `${res.status}: ${txt.slice(0, 200)}` });
        return;
      }
      if (!res.body) {
        onEvent?.({ type: 'error', error: 'No stream body' });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf('\n\n')) !== -1) {
          const chunk = buf.slice(0, idx);
          buf = buf.slice(idx + 2);
          const line = chunk.split('\n').reduce((acc, l) => {
            if (l.startsWith('event:')) acc.event = l.slice(6).trim();
            else if (l.startsWith('data:')) acc.data = (acc.data || '') + l.slice(5).trim();
            return acc;
          }, {});
          if (!line.event || line.data == null) continue;
          let parsed;
          try { parsed = JSON.parse(line.data); } catch { continue; }
          onEvent?.({ type: line.event, ...parsed });
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') onEvent?.({ type: 'error', error: err.message });
    }
  })();

  return () => abort.abort();
}
