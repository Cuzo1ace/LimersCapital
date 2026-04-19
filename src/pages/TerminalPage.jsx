import { lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import PremiumGate from '../components/terminal/PremiumGate';
import GlassCard from '../components/ui/GlassCard';

const ResearchPanel  = lazy(() => import('../components/terminal/ResearchPanel'));
const PortfolioPanel = lazy(() => import('../components/terminal/PortfolioPanel'));
const SimulatePanel  = lazy(() => import('../components/terminal/SimulatePanel'));
const MacroPanel     = lazy(() => import('../components/terminal/MacroPanel'));
const MicroPanel     = lazy(() => import('../components/terminal/MicroPanel'));
const McpSettings    = lazy(() => import('../components/terminal/McpSettings'));
const AiChatDrawer   = lazy(() => import('../components/terminal/AiChatDrawer'));
const FindGemsTour   = lazy(() => import('../components/terminal/FindGemsTour'));

const SUB_TABS = [
  { id: 'research',  label: 'Research',  hint: 'Valuation · Activity · News' },
  { id: 'portfolio', label: 'Portfolio', hint: 'Upload · Look-through · Overlap' },
  { id: 'simulate',  label: 'Simulate',  hint: 'Monte Carlo · Scenarios' },
  { id: 'macro',     label: 'Macro',     hint: 'Fed · CPI · DXY · Yields' },
  { id: 'micro',     label: 'Micro',     hint: 'Flows · Options · On-chain' },
  { id: 'mcp',       label: 'MCP',       hint: 'Plug your own agent' },
];

function Loading() {
  return (
    <GlassCard className="p-8 text-center text-muted text-sm font-mono">
      Loading module…
    </GlassCard>
  );
}

function Panel({ sub }) {
  switch (sub) {
    case 'research':  return <ResearchPanel />;
    case 'portfolio': return <PortfolioPanel />;
    case 'simulate':  return <SimulatePanel />;
    case 'macro':     return <MacroPanel />;
    case 'micro':     return <MicroPanel />;
    case 'mcp':       return <McpSettings />;
    default:          return <ResearchPanel />;
  }
}

export default function TerminalPage() {
  const sub        = useStore(s => s.terminalSubTab);
  const setSub     = useStore(s => s.setTerminalSubTab);
  const isChatOpen = useStore(s => s.isChatOpen);
  const setChat    = useStore(s => s.setIsChatOpen);
  const tourSeen   = useStore(s => s.terminalTourSeen);

  return (
    <PremiumGate>
      <div className="relative">
        {/* Header strip */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
          <div>
            <div className="text-[.6rem] uppercase tracking-[.35em] text-gold font-mono mb-1">
              Terminal · Pro
            </div>
            <h1 className="font-headline text-2xl md:text-3xl font-black italic tracking-tight">
              Investing <span className="text-sea">Workbench</span>
            </h1>
          </div>
          <button
            onClick={() => setChat(!isChatOpen)}
            className={`px-3 py-1.5 rounded-md text-[.7rem] uppercase tracking-widest font-headline font-bold transition-all border
              ${isChatOpen
                ? 'bg-sea text-night border-sea'
                : 'bg-transparent text-sea border-sea/40 hover:bg-sea/10'}`}
          >
            {isChatOpen ? '◀ Close chat' : 'Ask AI ▸'}
          </button>
        </div>

        {/* Sub-tab strip */}
        <div className="flex flex-wrap gap-1.5 mb-5 overflow-x-auto scrollbar-none">
          {SUB_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setSub(t.id)}
              className={`group flex flex-col items-start px-3.5 py-2 rounded-lg transition-all border
                ${sub === t.id
                  ? 'bg-sea/10 border-sea/30 text-sea'
                  : 'bg-transparent border-border text-txt-2 hover:text-txt hover:bg-white/5'}`}
            >
              <span className="text-[.72rem] uppercase tracking-widest font-headline font-bold">
                {t.label}
              </span>
              <span className="text-[.58rem] text-muted mt-0.5 font-mono tracking-wide">
                {t.hint}
              </span>
            </button>
          ))}
        </div>

        {/* Panel area — content shifts left when chat drawer is open on desktop */}
        <div
          className={`transition-all duration-300 ${isChatOpen ? 'md:mr-[380px]' : ''}`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={sub}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<Loading />}>
                <Panel sub={sub} />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* AI chat drawer */}
        <Suspense fallback={null}>
          {isChatOpen && <AiChatDrawer onClose={() => setChat(false)} />}
        </Suspense>

        {/* Find Gems tour — first visit only */}
        <Suspense fallback={null}>
          {!tourSeen && <FindGemsTour />}
        </Suspense>
      </div>
    </PremiumGate>
  );
}
