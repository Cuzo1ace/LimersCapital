import { useRef, useState } from 'react';
import useStore from '../../store/useStore';
import GlassCard from '../ui/GlassCard';
import { parsePortfolioText } from '../../api/portfolioParser';

export default function PortfolioUpload() {
  const uploaded   = useStore(s => s.uploadedPortfolio);
  const setUploaded = useStore(s => s.setUploadedPortfolio);
  const inputRef   = useRef(null);
  const [error, setError]   = useState(null);
  const [drag, setDrag]     = useState(false);
  const [textBuf, setTextBuf] = useState('');

  function ingest(text) {
    try {
      const positions = parsePortfolioText(text);
      if (!positions.length) throw new Error('No valid positions found');
      setUploaded(positions);
      setError(null);
      setTextBuf('');
    } catch (e) {
      setError(e.message || 'Parse failed');
    }
  }

  async function onFile(file) {
    if (!file) return;
    const text = await file.text();
    ingest(text);
  }

  function onDrop(e) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }

  async function loadSample() {
    try {
      const r = await fetch('/samples/portfolio.csv');
      if (!r.ok) throw new Error(`Sample load failed: ${r.status}`);
      ingest(await r.text());
    } catch (e) {
      setError(e.message);
    }
  }

  function clearPortfolio() {
    setUploaded([]);
    setError(null);
  }

  const total = uploaded.reduce((s, p) => s + (Number(p.price) * Number(p.qty) || 0), 0);

  return (
    <GlassCard className="p-5 min-h-[420px]">
      <div className="text-[.65rem] uppercase tracking-[.3em] text-muted font-mono mb-3">
        Upload holdings
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-5 text-center transition-all
          ${drag ? 'border-sea bg-sea/5' : 'border-border hover:border-sea/50 hover:bg-white/[0.02]'}`}
      >
        <div className="text-txt text-sm font-headline mb-1">
          Drop CSV / JSON <span className="text-muted">or click to browse</span>
        </div>
        <div className="text-muted text-[.65rem] font-mono">
          Headers: symbol · qty · price (aliases ok — ticker / quantity / cost)
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.json,text/csv,application/json"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>

      {/* Paste fallback */}
      <div className="mt-3">
        <textarea
          value={textBuf}
          onChange={(e) => setTextBuf(e.target.value)}
          placeholder="…or paste CSV / JSON here and press Import"
          rows={4}
          className="w-full text-xs font-mono bg-[rgba(255,255,255,0.03)] border border-border rounded-lg p-2 text-txt placeholder:text-muted focus:outline-none focus:border-sea/50"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => ingest(textBuf)}
            disabled={!textBuf.trim()}
            className="px-3 py-1.5 rounded-md text-[.7rem] uppercase tracking-widest font-headline font-bold bg-sea text-night disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Import
          </button>
          <button
            onClick={loadSample}
            className="px-3 py-1.5 rounded-md text-[.7rem] uppercase tracking-widest font-headline bg-transparent border border-border text-txt-2 hover:text-txt hover:bg-white/5"
          >
            Load sample
          </button>
          {uploaded.length > 0 && (
            <button
              onClick={clearPortfolio}
              className="ml-auto px-3 py-1.5 rounded-md text-[.7rem] uppercase tracking-widest font-headline bg-transparent border border-border text-muted hover:text-down hover:border-down/40"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 text-[.7rem] text-down font-mono">⚠ {error}</div>
      )}

      {/* Loaded positions preview */}
      {uploaded.length > 0 && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-[.6rem] uppercase tracking-[.3em] text-muted font-mono">
              Loaded positions · {uploaded.length}
            </div>
            <div className="text-txt text-sm font-mono">
              ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="max-h-[200px] overflow-y-auto text-xs font-mono">
            {uploaded.map((p, i) => (
              <div key={`${p.symbol}-${i}`}
                   className="flex justify-between py-1 border-b border-border/50 last:border-0">
                <span className="text-txt">{p.symbol}</span>
                <span className="text-muted">
                  {p.qty} × ${Number(p.price).toFixed(2)}
                </span>
                <span className="text-txt-2">
                  ${(p.qty * p.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
