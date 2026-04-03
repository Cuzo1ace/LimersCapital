import { useState } from 'react';

const SOLFLARE_LINK = 'https://www.solflare.com/?af_qr=true&shortlink=carribean&c=Carribean&pid=Solana%20Carribean&af_xp=qr&source_caller=ui';
const WAM_LINK = 'https://wam.money/';

const STEPS = [
  {
    icon: '🔐',
    title: 'What is a Wallet?',
    desc: 'A crypto wallet is like a digital bank account. It stores your tokens and lets you send, receive, and trade. Only you control it — no bank, no middleman.',
    tip: 'Think of it as your personal vault on the blockchain.',
  },
  {
    icon: '📲',
    title: 'Download Solflare',
    desc: 'Solflare is a free, secure wallet app built for Solana. Available on iOS, Android, and as a browser extension.',
    tip: 'It takes about 2 minutes to set up.',
    action: { label: 'Get Solflare (Free)', url: SOLFLARE_LINK },
    altAction: { label: 'Top up with Wam', url: WAM_LINK },
  },
  {
    icon: '🔗',
    title: 'Connect to Limer\'s Capital',
    desc: 'After installing Solflare, click the "Connect" button at the top of this page. Solflare will ask you to approve the connection.',
    tip: 'Connecting is safe — we never access your private keys or funds.',
  },
  {
    icon: '🎉',
    title: 'You\'re Ready!',
    desc: 'Once connected, you can use Jupiter Swap for real trading, view your on-chain balances, and earn bonus LP for on-chain activity.',
    tip: 'You can always paper trade without a wallet too!',
  },
];

export default function WalletSetupWizard({ onClose }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  return (
    <div className="rounded-xl border border-sea/20 p-5 mb-5"
      style={{ background: 'linear-gradient(135deg, rgba(0,255,163,.06) 0%, var(--color-card) 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-[.66rem] text-sea uppercase tracking-widest font-headline">
          Wallet Setup Guide
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[.65rem] text-muted">Step {step + 1} of {STEPS.length}</span>
          {onClose && (
            <button onClick={onClose}
              className="text-muted text-[.7rem] bg-transparent border-none cursor-pointer hover:text-txt">
              Skip
            </button>
          )}
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-5">
        {STEPS.map((_, i) => (
          <div key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-sea' : 'bg-white/10'}`} />
        ))}
      </div>

      {/* Step content */}
      <div className="text-center py-4">
        <div className="text-[2.5rem] mb-3">{current.icon}</div>
        <h3 className="font-headline text-[1.1rem] font-black text-txt mb-2">{current.title}</h3>
        <p className="text-[.8rem] text-txt-2 leading-relaxed max-w-sm mx-auto mb-3">{current.desc}</p>
        <p className="text-[.68rem] text-sea/70 italic">{current.tip}</p>

        {current.action && (
          <div className="flex gap-3 justify-center mt-4 flex-wrap">
            <a href={current.action.url} target="_blank" rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl text-[.8rem] font-bold no-underline
                bg-[#FC5602] text-white hover:bg-[#e04e02] transition-colors">
              {current.action.label}
            </a>
            {current.altAction && (
              <a href={current.altAction.url} target="_blank" rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl text-[.8rem] font-bold no-underline
                  bg-white/10 text-txt border border-border hover:bg-white/15 transition-colors">
                {current.altAction.label}
              </a>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/8">
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className="px-4 py-2 rounded-lg text-[.75rem] bg-transparent border border-border text-muted
            cursor-pointer disabled:opacity-30 disabled:cursor-default hover:text-txt transition-colors">
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="px-5 py-2 rounded-lg text-[.75rem] bg-sea/15 border border-sea/30 text-sea
              cursor-pointer font-bold hover:bg-sea/25 transition-colors">
            Next
          </button>
        ) : (
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-[.75rem] bg-sea/15 border border-sea/30 text-sea
              cursor-pointer font-bold hover:bg-sea/25 transition-colors">
            Done
          </button>
        )}
      </div>
    </div>
  );
}
