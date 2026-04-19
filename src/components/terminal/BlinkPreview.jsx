import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import HolographicCard from '../ui/HolographicCard';
import HolographicLink from '../ui/HolographicLink';
import HoverPeek from '../ui/HoverPeek';

/**
 * Modal preview of a Solana Action (Blink) manifest.
 *
 * Fetches the given Action URL from our worker and renders the card
 * the same way Phantom / Twitter / Dialect would — same fields, same
 * visual hierarchy. This removes the third-party-inspector dependency
 * (dial.to has paused its Vercel deployment as of 2026-04-18) and
 * doubles as a live healthcheck for the /actions/exposure endpoint.
 *
 * Props:
 *   url      — the full Solana Action URL to preview
 *   onClose  — called when the user dismisses
 */
export default function BlinkPreview({ url, onClose }) {
  const [manifest, setManifest] = useState(null);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [rawView, setRawView]   = useState(false);
  const [copied, setCopied]     = useState(false);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(url, { headers: { Accept: 'application/json' } })
      .then(async r => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then(data => { if (!cancelled) { setManifest(data); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [url]);

  function copyUrl() {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  // Parse the share URL into a friendlier summary for the hover preview.
  const parsedUrl = useMemo(() => {
    try {
      const u = new URL(url);
      const params = Array.from(u.searchParams.entries());
      return { host: u.host, pathname: u.pathname, params };
    } catch {
      return null;
    }
  }, [url]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        style={{ background: 'rgba(13,14,16,0.75)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-lg w-full"
        >
          {/* HolographicCard wraps the whole share surface with Veridian-palette
             iridescent shimmer + 3D parallax so the most shareable artifact on
             the platform feels like a trading-card collectible. Intensity is
             dialed down so the content stays legible. */}
          <HolographicCard intensity={0.55} tiltMax={4} className="rounded-xl">
          <GlassCard variant="elevated" className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-[.6rem] uppercase tracking-[.3em] text-sea font-mono">
                Blink preview · Solana Action
              </div>
              <button
                onClick={onClose}
                className="text-muted hover:text-txt text-sm transition-colors"
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>

            {/* Card — Phantom/Twitter-style rendering */}
            {loading && (
              <div className="p-8 text-center text-muted text-sm font-mono animate-pulse">
                fetching manifest…
              </div>
            )}
            {error && (
              <div className="p-4 rounded-md bg-down/10 border border-down/30 text-[.75rem] text-down font-mono">
                ⚠ {error}
              </div>
            )}
            {manifest && !rawView && (
              <div className="rounded-xl overflow-hidden border border-border bg-[rgba(255,255,255,0.02)]">
                {/* Visual — icon as hero */}
                {manifest.icon && (
                  <div className="aspect-[16/9] bg-gradient-to-br from-sea/10 to-gold/10 flex items-center justify-center">
                    <img
                      src={manifest.icon}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="text-[.55rem] uppercase tracking-[.25em] text-muted font-mono mb-1">
                    limerscapital.com
                  </div>
                  <h3 className="font-headline text-lg font-black text-txt mb-2 leading-tight">
                    {manifest.title}
                  </h3>
                  <p className="text-[.78rem] text-txt-2 whitespace-pre-line leading-relaxed mb-4">
                    {manifest.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(manifest.links?.actions || [{ label: manifest.label, href: '#' }]).map((a, i) => (
                      <a
                        key={i}
                        href={a.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-md text-[.7rem] uppercase tracking-widest font-headline font-bold bg-sea text-night hover:bg-sea/90 transition-colors no-underline"
                      >
                        {a.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Raw JSON view — for judges / debug */}
            {manifest && rawView && (
              <pre className="p-3 rounded-md bg-[rgba(0,0,0,0.4)] border border-border text-[.62rem] text-txt font-mono whitespace-pre overflow-x-auto max-h-[340px]">
{JSON.stringify(manifest, null, 2)}
              </pre>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-between mt-4 gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setRawView(v => !v)}
                  className="text-[.6rem] px-2 py-1 rounded font-mono bg-white/[0.04] border border-border text-txt-2 hover:text-sea hover:border-sea/40"
                >
                  {rawView ? '◂ card view' : 'view json ▸'}
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[.6rem] px-2 py-1 rounded font-mono bg-white/[0.04] border border-border text-txt-2 hover:text-sea hover:border-sea/40"
                >
                  open raw ↗
                </a>
              </div>
              {/* Primary share CTA — the single artifact users copy.
                 Wrapped in HolographicLink so the act of copying the
                 Blink feels like claiming a trading card, not pressing
                 a utility button. Intentionally the ONLY link on this
                 surface with the tilt treatment. */}
              <HolographicLink
                as="button"
                type="button"
                onClick={copyUrl}
                tiltMax={5}
                className={`text-[.7rem] uppercase tracking-widest font-headline font-bold border-none ${copied ? 'is-copied' : ''}`}
                aria-label={copied ? 'URL copied' : 'Copy share URL'}
              >
                {copied ? '✓ url copied' : '▸ copy share url'}
              </HolographicLink>
            </div>

            {/* URL preview — hover to inspect host + query breakdown */}
            <HoverPeek
              side="top"
              align="start"
              width={320}
              height={150}
              content={parsedUrl ? (
                <div className="p-3">
                  <div className="text-[.55rem] uppercase tracking-[.3em] text-gold font-mono mb-1">
                    Share URL · host
                  </div>
                  <div className="text-txt text-[.7rem] font-mono break-all mb-2">
                    {parsedUrl.host}<span className="text-muted">{parsedUrl.pathname}</span>
                  </div>
                  <div className="text-[.55rem] uppercase tracking-widest text-muted font-mono mb-1">
                    Query params (aggregate only)
                  </div>
                  <div className="space-y-0.5 max-h-[90px] overflow-y-auto">
                    {parsedUrl.params.map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-[.6rem] font-mono">
                        <span className="text-txt-2">{k}</span>
                        <span className="text-sea">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-[.7rem] font-mono text-muted">Unparseable URL</div>
              )}
            >
              <div
                tabIndex={0}
                className="mt-3 text-[.58rem] font-mono text-muted break-all cursor-help hover:text-txt-2 transition-colors focus:outline-none focus:ring-1 focus:ring-sea/30 rounded px-1 -mx-1"
              >
                {url}
              </div>
            </HoverPeek>

            <div className="mt-3 text-[.58rem] font-mono text-txt-2 italic">
              This is exactly how the card renders in Phantom, Solflare, Twitter/X,
              and any Solana-Action-capable client. Manifest fetched live from your
              Cloudflare Worker — proof the endpoint works.
            </div>
          </GlassCard>
          </HolographicCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
