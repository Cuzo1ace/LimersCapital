import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../../store/useStore';
import { streamChat } from '../../api/aiChat';

function Bubble({ role, children }) {
  const base = 'rounded-lg px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap font-mono';
  if (role === 'user') {
    return <div className={`${base} bg-sea/10 border border-sea/20 text-txt ml-6`}>{children}</div>;
  }
  if (role === 'tool') {
    return <div className={`${base} bg-gold/10 border border-gold/20 text-gold/90 italic`}>{children}</div>;
  }
  return <div className={`${base} bg-white/[0.03] border border-border text-txt mr-6`}>{children}</div>;
}

export default function AiChatDrawer({ onClose }) {
  const uploaded = useStore(s => s.uploadedPortfolio);

  // Thread items: { role: 'user'|'assistant'|'tool', text?: string, tool?: {name, phase, input?, result?} }
  const [items, setItems] = useState([
    { role: 'assistant', text: 'Hey. Load a portfolio on the Portfolio tab and ask me to break down your hidden exposure, run a Monte Carlo, or compare tickers. I\'ll pull real numbers and explain them.' },
  ]);
  const [input, setInput]   = useState('');
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState(null);
  const stopRef             = useRef(null);
  const scrollRef           = useRef(null);

  useEffect(() => () => stopRef.current?.(), []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [items, busy]);

  function send() {
    const q = input.trim();
    if (!q || busy) return;

    const next = [...items, { role: 'user', text: q }];
    setItems([...next, { role: 'assistant', text: '' }]);
    setInput('');
    setBusy(true);
    setError(null);

    // Build API-shaped history from thread items (exclude tool indicator rows).
    const apiMessages = next
      .filter(i => i.role !== 'tool')
      .map(i => ({ role: i.role, content: i.text }));

    stopRef.current = streamChat({
      messages: apiMessages,
      portfolioSnapshot: uploaded,
      onEvent: (evt) => {
        if (evt.type === 'text') {
          setItems(prev => {
            const out = [...prev];
            const last = out[out.length - 1];
            if (last?.role === 'assistant') out[out.length - 1] = { ...last, text: (last.text || '') + evt.text };
            return out;
          });
        } else if (evt.type === 'tool') {
          setItems(prev => [...prev, {
            role: 'tool',
            text: evt.phase === 'call'
              ? `▸ running ${evt.name}(${JSON.stringify(evt.input || {}).slice(0, 80)})`
              : `✓ ${evt.name} returned`,
          }, { role: 'assistant', text: '' }]);
        } else if (evt.type === 'done') {
          setBusy(false);
        } else if (evt.type === 'error') {
          setError(evt.error || 'chat failed');
          setBusy(false);
        }
      },
    });
  }

  function keyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <motion.aside
      initial={{ x: 420, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 420, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="fixed right-0 top-14 md:top-16 bottom-0 w-full md:w-[380px] z-40 border-l border-border backdrop-blur-2xl flex flex-col"
      style={{ background: 'rgba(13,14,16,0.94)' }}
      aria-label="AI chat drawer"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div>
          <div className="text-[.7rem] uppercase tracking-widest font-headline font-bold text-sea">
            Claude · Terminal co-pilot
          </div>
          <div className="text-[.55rem] text-muted font-mono mt-0.5">
            {uploaded.length} positions loaded · paper-trade only
          </div>
        </div>
        <button onClick={onClose} className="text-muted hover:text-txt text-sm transition-colors" aria-label="Close chat">
          ✕
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.map((it, i) => (
          (it.text || it.role === 'tool') && <Bubble key={i} role={it.role}>{it.text}</Bubble>
        ))}
        {busy && items[items.length - 1]?.text === '' && (
          <div className="text-[.6rem] text-muted font-mono ml-1 animate-pulse">thinking…</div>
        )}
        {error && (
          <div className="text-[.7rem] text-down font-mono">⚠ {error}</div>
        )}
      </div>

      <div className="p-3 border-t border-border flex-shrink-0">
        <div className="flex gap-2 mb-2 flex-wrap">
          {['break down my hidden NVDA exposure', 'run a 1-year Monte Carlo on AAPL', 'compare TSLA vs NVDA'].map(p => (
            <button
              key={p}
              onClick={() => setInput(p)}
              disabled={busy}
              className="text-[.6rem] px-2 py-1 rounded font-mono bg-white/[0.04] border border-border text-txt-2 hover:text-sea hover:border-sea/40 disabled:opacity-40"
            >
              {p}
            </button>
          ))}
        </div>
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={keyDown}
            disabled={busy}
            rows={2}
            placeholder="Ask about a ticker, your exposure, or a simulation…"
            className="w-full text-xs font-mono bg-[rgba(255,255,255,0.03)] border border-border rounded-lg p-2 pr-12 text-txt placeholder:text-muted focus:outline-none focus:border-sea/50 resize-none"
          />
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            className="absolute right-1.5 bottom-1.5 px-2 py-1 rounded text-[.65rem] uppercase tracking-widest font-headline font-bold bg-sea text-night disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {busy ? '···' : 'send'}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
