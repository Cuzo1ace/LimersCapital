import { useState, useEffect } from 'react';
import useStore from '../store/useStore';

/**
 * First-visit explainer modal for the Trade page.
 * Shows once, then never again (persisted via store).
 */
export default function PaperTradingModal() {
  const hasSeenPaperModal = useStore(s => s.hasSeenPaperModal);
  const setHasSeenPaperModal = useStore(s => s.setHasSeenPaperModal);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasSeenPaperModal) {
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, [hasSeenPaperModal]);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    setHasSeenPaperModal(true);
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={dismiss}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#0d0e10] border border-sea/25 rounded-2xl p-7 max-w-md w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <div className="text-[3rem] mb-2">🎮</div>
          <h2 className="font-headline text-[1.4rem] font-black text-txt mb-2">
            Practice Mode — No Real Money
          </h2>
        </div>

        <div className="space-y-3 mb-6">
          <ExplainerRow icon="💰" title="$100,000 Virtual Cash" desc="You start with $100K in virtual money to practice buying and selling crypto tokens." />
          <ExplainerRow icon="🛡️" title="Zero Risk" desc="Nothing you do here uses real money. Make mistakes, experiment, and learn without consequences." />
          <ExplainerRow icon="📈" title="Real Market Prices" desc="Prices are live from real markets, so your practice reflects actual market conditions." />
          <ExplainerRow icon="🏆" title="Earn XP & Badges" desc="Every trade earns experience points. Level up and unlock new features as you learn." />
        </div>

        <button
          onClick={dismiss}
          className="w-full py-3 rounded-xl font-headline font-bold text-[.9rem] cursor-pointer
            bg-gradient-to-r from-sea/90 to-[#2D9B56] text-white border-none
            hover:from-sea hover:to-[#3aad65] transition-all"
        >
          Got it — Let me explore!
        </button>

        <p className="text-center text-[.65rem] text-muted mt-3">
          You can switch to real trading with Jupiter Swap anytime after connecting a wallet.
        </p>
      </div>
    </div>
  );
}

function ExplainerRow({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-xl flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <div className="font-body font-bold text-[.82rem] text-txt">{title}</div>
        <div className="text-[.72rem] text-txt-2 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}
