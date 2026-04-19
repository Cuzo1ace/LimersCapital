import { useMemo, useState } from 'react';
import useStore from '../../store/useStore';
import GlassCard from '../ui/GlassCard';
import { TERMINAL_TOOLS } from '../../api/terminalTools';
import { useCluster } from '../../solana/provider';
import { getAccountExplorerUrl } from '../../solana/config';
import HoverPeek from '../ui/HoverPeek';
import HolographicLink from '../ui/HolographicLink';
import ExplorerPreview from './ExplorerPreview';

function genKey() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

function CopyField({ label, value, mono = true }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[.55rem] uppercase tracking-widest text-muted font-mono">{label}</span>
        <button
          onClick={copy}
          className="text-[.6rem] text-sea hover:text-txt transition-colors font-mono"
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <div className={`px-3 py-2 rounded-md bg-[rgba(255,255,255,0.03)] border border-border text-txt break-all ${mono ? 'font-mono text-xs' : 'text-sm'}`}>
        {value}
      </div>
    </div>
  );
}

export default function McpSettings() {
  const mcpKey    = useStore(s => s.mcpApiKey);
  const setMcpKey = useStore(s => s.setMcpApiKey);
  const passAddr  = useStore(s => s.passAddress);
  const { cluster } = useCluster();
  const [revealed, setRevealed] = useState(false);

  const proxy = import.meta.env.VITE_API_PROXY_URL || 'https://limer-api-proxy.workers.dev';
  const endpoint = `${proxy.replace(/\/$/, '')}/mcp/terminal`;
  const shownKey = mcpKey || '— not generated —';
  const maskedKey = mcpKey ? `${mcpKey.slice(0, 8)}…${mcpKey.slice(-4)}` : shownKey;
  const cliCmd = `claude mcp add --transport http terminal "${endpoint}" --header "x-api-key: ${mcpKey || '<YOUR_KEY>'}"`;

  const jsonSnippet = useMemo(() => JSON.stringify({
    mcpServers: {
      terminal: {
        url: endpoint,
        headers: { 'x-api-key': mcpKey || '<YOUR_KEY>' },
      },
    },
  }, null, 2), [endpoint, mcpKey]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <GlassCard className="lg:col-span-7 p-6">
        <div className="text-[.65rem] uppercase tracking-[.3em] text-gold font-mono mb-2">
          Model Context Protocol · bring your own agent
        </div>
        <h2 className="font-headline text-2xl md:text-3xl font-black italic mb-3">
          Plug Claude <span className="text-sea">straight into your book</span>
        </h2>
        <p className="text-txt-2 text-sm mb-6 leading-relaxed">
          The Terminal exposes all {TERMINAL_TOOLS.length} research, portfolio, Monte Carlo,
          macro, micro, and paper-trade tools as an MCP server. Point any
          MCP-capable client — Claude Code, Claude Desktop, or your own agent —
          at this URL and it talks to the same data the dashboard does.
        </p>

        {passAddr && (
          <div className="mb-4 p-3 rounded-md bg-gradient-to-br from-gold/10 to-sea/10 border border-gold/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[.55rem] uppercase tracking-widest text-gold font-mono">
                Your Terminal Pass · verified on-chain
              </span>
              <HoverPeek
                content={<ExplorerPreview address={passAddr} cluster={cluster} kind="account" label="Terminal Access Pass" />}
                side="top" align="end"
              >
                <HolographicLink
                  href={getAccountExplorerUrl(passAddr, cluster)}
                  tiltMax={3}
                  className="text-[.6rem] font-mono"
                >
                  view on explorer ↗
                </HolographicLink>
              </HoverPeek>
            </div>
            <div className="text-txt font-mono text-[.7rem] break-all">{passAddr}</div>
          </div>
        )}

        <CopyField label="Endpoint" value={endpoint} />

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[.55rem] uppercase tracking-widest text-muted font-mono">API key</span>
            <div className="flex gap-3">
              <button
                onClick={() => setRevealed(r => !r)}
                className="text-[.6rem] text-muted hover:text-txt transition-colors font-mono"
              >
                {revealed ? 'hide' : 'reveal'}
              </button>
              <button
                onClick={() => setMcpKey(genKey())}
                className="text-[.6rem] text-sea hover:text-txt transition-colors font-mono"
              >
                {mcpKey ? 'rotate' : 'generate'}
              </button>
            </div>
          </div>
          <div className="px-3 py-2 rounded-md bg-[rgba(255,255,255,0.03)] border border-border text-txt font-mono text-xs break-all">
            {mcpKey ? (revealed ? mcpKey : maskedKey) : 'click "generate" to create a key'}
          </div>
          <div className="text-[.6rem] text-muted mt-1 font-mono">
            Keys grant access to your portfolio snapshots &amp; paper-trading ledger. Rotate anytime.
          </div>
        </div>

        <div className="mb-4">
          <div className="text-[.55rem] uppercase tracking-widest text-muted font-mono mb-1">
            One-line install (Claude Code)
          </div>
          <pre className="px-3 py-2 rounded-md bg-[rgba(0,0,0,0.4)] border border-border text-sea font-mono text-xs whitespace-pre-wrap break-all">
{cliCmd}
          </pre>
          <button
            onClick={() => navigator.clipboard?.writeText(cliCmd)}
            className="mt-2 text-[.6rem] text-sea hover:text-txt transition-colors font-mono"
          >
            copy command
          </button>
        </div>

        <div>
          <div className="text-[.55rem] uppercase tracking-widest text-muted font-mono mb-1">
            mcp.json (Claude Desktop / custom clients)
          </div>
          <pre className="px-3 py-2 rounded-md bg-[rgba(0,0,0,0.4)] border border-border text-txt font-mono text-[.65rem] whitespace-pre overflow-x-auto">
{jsonSnippet}
          </pre>
        </div>
      </GlassCard>

      <GlassCard className="lg:col-span-5 p-5">
        <div className="text-[.65rem] uppercase tracking-[.3em] text-muted font-mono mb-3">
          Tools exposed
        </div>
        <div className="space-y-1.5 text-xs font-mono">
          {TERMINAL_TOOLS.map(t => (
            <div key={t.name} className="p-2 rounded bg-white/[0.02] border border-border/50">
              <div className="text-sea">{t.name}</div>
              <div className="text-txt-2 text-[.7rem] mt-0.5">{t.description}</div>
            </div>
          ))}
        </div>
        <div className="text-[.58rem] text-muted mt-4 italic leading-relaxed">
          No <span className="text-txt">submit_real_trade</span> tool exists — that enforcement
          is structural, not a flag. Paper trading only.
        </div>
      </GlassCard>
    </div>
  );
}
