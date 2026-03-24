import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';

const EXPERIENCE_LEVELS = [
  { id: 'beginner', icon: '🌱', label: 'Brand new', desc: 'What even is crypto? Explain it simply.', color: '#00ffa3' },
  { id: 'intermediate', icon: '📊', label: 'I know the basics', desc: 'Wallets, tokens, DeFi — I get the gist.', color: '#9945FF' },
  { id: 'advanced', icon: '🚀', label: "I'm experienced", desc: 'LPing, on-chain analysis, yield strategies.', color: '#FACC15' },
];

const STEPS = [
  {
    type: 'experience',
    icon: '🤔',
    title: 'How familiar are you with crypto?',
    desc: 'This helps us tailor your learning experience.',
    color: '#00ffa3',
  },
  {
    icon: '🌴',
    title: 'Welcome to Limer\'s Capital',
    desc: 'Your all-in-one Caribbean crypto intelligence platform — real-time market data, paper trading, regulation maps, and more. Built for the Caribbean, for the world.',
    color: '#00ffa3',
  },
  {
    icon: '📊',
    title: 'Live Solana Market Data',
    desc: 'Track 15+ Solana tokens with live prices from Pyth, DexScreener, and Jupiter. The price ticker at the top updates every 30 seconds.',
    color: '#9945FF',
    tab: 'market',
    tabLabel: 'Solana tab',
  },
  {
    icon: '💹',
    title: 'Paper Trade Risk-Free',
    desc: 'Practice trading Solana tokens and TTSE stocks with $100,000 USD and TT$679,000 — no real money needed. When you\'re ready, jump to Jupiter for real trades.',
    color: '#00ffa3',
    tab: 'trade',
    tabLabel: 'Paper Trade tab',
  },
  {
    icon: '🗺️',
    title: 'Caribbean Regulation Map',
    desc: '22 Caribbean jurisdictions mapped by crypto legal status — from Bermuda\'s dedicated DABA to ECCU\'s regional framework. Filter by status or search by law name.',
    color: '#FACC15',
    tab: 'regulation',
    tabLabel: 'Regulation tab',
  },
  {
    type: 'learn-cta',
    icon: '📚',
    title: 'Start Your Journey',
    desc: 'Complete lessons to earn XP, unlock trading features, and climb the tier ranks. Knowledge is your first trade — learn before you earn.',
    color: '#00ffa3',
    tab: 'learn',
    tabLabel: 'Learn tab',
  },
];

export default function OnboardingTour() {
  const { hasSeenOnboarding, setHasSeenOnboarding, setActiveTab, setExperienceLevel } = useStore();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState(null);

  if (hasSeenOnboarding) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isExperienceStep = current.type === 'experience';
  const isLearnCTA = current.type === 'learn-cta';

  function goTo(next) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  function finish(tab) {
    setHasSeenOnboarding(true);
    if (tab) setActiveTab(tab);
  }

  function handleExperienceSelect(level) {
    setSelectedLevel(level);
    setExperienceLevel(level);
  }

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: 'rgba(5,12,28,.85)', backdropFilter: 'blur(6px)' }}
        onClick={(e) => e.target === e.currentTarget && finish('learn')}
      >
        <motion.div
          key="card"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-md rounded-xl border overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0d1f3c 0%, #091629 100%)',
            borderColor: current.color + '40',
            boxShadow: `0 0 60px ${current.color}18, 0 25px 60px rgba(0,0,0,.6)`,
          }}
        >
          {/* Color bar */}
          <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${current.color}, ${current.color}55)` }} />

          <div className="px-7 py-8">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="h-1.5 rounded-full transition-all cursor-pointer border-none"
                    style={{
                      width: i === step ? 24 : 8,
                      background: i === step ? current.color : 'rgba(255,255,255,.15)',
                    }}
                  />
                ))}
              </div>
              <button
                onClick={() => finish('learn')}
                className="text-[.7rem] text-muted hover:text-txt transition-colors cursor-pointer bg-transparent border-none font-mono"
              >
                Skip tour
              </button>
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -40 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl mb-5 mx-auto"
                  style={{ background: current.color + '18', border: `1px solid ${current.color}33` }}
                >
                  {current.icon}
                </div>
                <h2 className="font-headline font-bold text-[1.3rem] text-center mb-3 text-txt leading-tight">
                  {current.title}
                </h2>
                <p className="text-[.82rem] text-txt-2 text-center leading-relaxed mb-2">
                  {current.desc}
                </p>

                {/* Experience level picker */}
                {isExperienceStep && (
                  <div className="flex flex-col gap-2.5 mt-5">
                    {EXPERIENCE_LEVELS.map(lvl => (
                      <button
                        key={lvl.id}
                        onClick={() => handleExperienceSelect(lvl.id)}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3.5 border cursor-pointer transition-all text-left
                          ${selectedLevel === lvl.id
                            ? 'border-sea bg-sea/10'
                            : 'border-border bg-black/20 hover:border-sea/30'}`}
                      >
                        <span className="text-2xl">{lvl.icon}</span>
                        <div className="flex-1">
                          <div className={`font-body font-bold text-[.85rem] ${selectedLevel === lvl.id ? 'text-sea' : 'text-txt'}`}>{lvl.label}</div>
                          <div className="text-[.7rem] text-muted">{lvl.desc}</div>
                        </div>
                        {selectedLevel === lvl.id && <span className="text-sea text-lg">&#10003;</span>}
                      </button>
                    ))}
                  </div>
                )}

                {/* Learn CTA — show benefits */}
                {isLearnCTA && (
                  <div className="flex flex-col gap-2 mt-4">
                    <div className="flex items-center gap-2 text-[.76rem] text-txt-2">
                      <span className="text-sea">&#9679;</span> Unlock TTSE trading, limit orders, portfolio tools
                    </div>
                    <div className="flex items-center gap-2 text-[.76rem] text-txt-2">
                      <span className="text-sea">&#9679;</span> Earn 50 XP per lesson, 100+ per quiz
                    </div>
                    <div className="flex items-center gap-2 text-[.76rem] text-txt-2">
                      <span className="text-sea">&#9679;</span> Climb 10 tiers from Sand Walker to Sovereign
                    </div>
                  </div>
                )}

                {current.tab && !isLearnCTA && (
                  <p className="text-[.7rem] text-center font-mono" style={{ color: current.color + 'bb' }}>
                    &#8594; Find it in the <span style={{ color: current.color }}>{current.tabLabel}</span>
                  </p>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center gap-3 mt-7">
              {step > 0 && (
                <button
                  onClick={() => goTo(step - 1)}
                  className="px-4 py-2.5 rounded-xl text-[.78rem] font-mono border border-border text-muted hover:text-txt hover:border-white/20 transition-all cursor-pointer bg-transparent"
                >
                  &#8592; Back
                </button>
              )}
              {isLearnCTA ? (
                <>
                  <button
                    onClick={() => finish('learn')}
                    className="flex-1 py-2.5 rounded-xl text-[.82rem] font-body font-bold transition-all cursor-pointer border-none"
                    style={{
                      background: `linear-gradient(135deg, ${current.color}, ${current.color}bb)`,
                      color: '#0d0e10',
                      boxShadow: `0 0 20px ${current.color}40`,
                    }}
                  >
                    Start Learning &#8594;
                  </button>
                  <button
                    onClick={() => finish('dashboard')}
                    className="px-4 py-2.5 rounded-xl text-[.78rem] font-mono border border-border text-muted hover:text-txt hover:border-white/20 transition-all cursor-pointer bg-transparent"
                  >
                    Explore
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    if (isExperienceStep && !selectedLevel) return;
                    goTo(step + 1);
                  }}
                  disabled={isExperienceStep && !selectedLevel}
                  className="flex-1 py-2.5 rounded-xl text-[.82rem] font-body font-bold transition-all cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(135deg, ${current.color}, ${current.color}bb)`,
                    color: '#0d0e10',
                    boxShadow: `0 0 20px ${current.color}40`,
                  }}
                >
                  Next &#8594;
                </button>
              )}
            </div>

            <p className="text-[.65rem] text-muted text-center mt-4 font-mono">
              {step + 1} of {STEPS.length}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
