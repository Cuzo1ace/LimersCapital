import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/useStore';

const STEPS = [
  {
    title: 'Welcome to the Terminal',
    body: 'A Bloomberg-style workspace for retail traders — upload your book, see true exposure, research any ticker, simulate outcomes, and chat with Claude.',
    cta: "Let's find some gems",
  },
  {
    title: 'Step 1 · Upload your portfolio',
    body: 'On the Portfolio tab, drop a CSV or JSON with your positions. Click "Load sample" if you want to see it in action first.',
    action: { tab: 'portfolio', label: 'Open Portfolio' },
  },
  {
    title: 'Step 2 · Uncover your hidden exposure',
    body: 'If you hold SPY + QQQ + ARKK, you probably own NVDA, AAPL, and TSLA three times over. The look-through donut flattens every ETF into single-name exposure so you see where your real risk sits.',
    action: { tab: 'portfolio', label: 'Show me' },
  },
  {
    title: 'Step 3 · Research like a pro',
    body: 'Pick any ticker on the Research tab — valuation multiples, sector comps, insider activity, and a clean 90-day chart. Filter the noise down to numbers that matter.',
    action: { tab: 'research', label: 'Open Research' },
  },
  {
    title: 'Step 4 · Run the simulation',
    body: 'The Simulate tab sprays 1,000 Monte Carlo paths across your horizon. P5, P50, and P95 tell you the range of realistic outcomes — not a prediction, a probability cone.',
    action: { tab: 'simulate', label: 'Run a sim' },
  },
  {
    title: 'Step 5 · Talk to your co-pilot',
    body: "Click Ask AI anywhere. Claude reads your portfolio, runs tools, and cites real numbers. Ask it: \"what's my biggest hidden exposure?\" — it\'ll call compute_overlap and explain.",
    cta: 'I\'m ready',
  },
];

export default function FindGemsTour() {
  const setTourSeen = useStore(s => s.setTerminalTourSeen);
  const setSubTab   = useStore(s => s.setTerminalSubTab);
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(true);

  function dismiss() {
    setOpen(false);
    setTimeout(() => setTourSeen(true), 200);
  }

  function next() {
    if (step >= STEPS.length - 1) return dismiss();
    const s = STEPS[step];
    if (s.action?.tab) setSubTab(s.action.tab);
    setStep(step + 1);
  }

  function prev() {
    if (step === 0) return;
    setStep(step - 1);
  }

  const s = STEPS[step];
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ background: 'rgba(13,14,16,0.65)', backdropFilter: 'blur(6px)' }}
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="max-w-lg w-full rounded-2xl border border-sea/30 p-6 shadow-[0_0_80px_rgba(0,255,163,0.15)]"
          style={{ background: 'rgba(13,14,16,0.97)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i === step ? 'bg-sea' : i < step ? 'bg-sea/40' : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          <div className="text-[.6rem] uppercase tracking-[.3em] text-gold font-mono mb-2">
            Find gems · {step + 1} / {STEPS.length}
          </div>
          <h2 className="font-headline text-2xl font-black italic mb-3 text-txt">
            {s.title}
          </h2>
          <p className="text-txt-2 text-sm leading-relaxed mb-6">
            {s.body}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={dismiss}
              className="text-[.7rem] text-muted hover:text-txt transition-colors font-mono underline underline-offset-4"
            >
              Skip tour
            </button>
            <div className="ml-auto flex gap-2">
              {step > 0 && (
                <button
                  onClick={prev}
                  className="px-3 py-1.5 rounded-md text-[.7rem] uppercase tracking-widest font-headline bg-transparent border border-border text-txt-2 hover:text-txt hover:bg-white/5"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={next}
                className="px-4 py-1.5 rounded-md text-[.7rem] uppercase tracking-widest font-headline font-bold bg-sea text-night hover:bg-sea/90"
              >
                {s.cta || s.action?.label || (step === STEPS.length - 1 ? 'Finish' : 'Next →')}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
