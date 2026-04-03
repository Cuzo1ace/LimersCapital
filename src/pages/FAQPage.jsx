import { useState } from 'react';
import useStore from '../store/useStore';
import { FAQ_ITEMS } from '../data/faq';

export default function FAQPage() {
  const [expanded, setExpanded] = useState(0);
  const setActiveTab = useStore(s => s.setActiveTab);

  return (
    <div>
      {/* Hero */}
      <div className="rounded-xl p-8 mb-7 border border-border text-center"
        style={{ background: 'linear-gradient(135deg, var(--color-night-2) 0%, rgba(0,255,163,.06) 100%)' }}>
        <div className="text-[3rem] mb-3">🆕</div>
        <h1 className="font-headline text-[2rem] font-black text-txt mb-2">
          New to Digital Assets?
        </h1>
        <p className="text-[.85rem] text-txt-2 max-w-lg mx-auto leading-relaxed">
          No jargon, no judgment. Here are the most common questions from people just like you who are exploring crypto for the first time.
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="max-w-2xl mx-auto space-y-2 mb-8">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i}
            className="rounded-xl border border-border overflow-hidden transition-all"
            style={{ background: 'var(--color-card)' }}>
            <button
              onClick={() => setExpanded(expanded === i ? -1 : i)}
              className="w-full text-left px-5 py-4 flex items-center gap-3 bg-transparent border-none cursor-pointer
                hover:bg-white/3 transition-colors"
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <span className="flex-1 font-body font-bold text-[.88rem] text-txt">{item.q}</span>
              <span className="text-muted text-[.75rem] flex-shrink-0">
                {expanded === i ? '▾' : '▸'}
              </span>
            </button>
            {expanded === i && (
              <div className="px-5 pb-4 text-[.8rem] text-txt-2 leading-relaxed border-t border-white/5 pt-3 ml-9">
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center py-6">
        <p className="text-[.82rem] text-txt-2 mb-4">Ready to start learning?</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button onClick={() => setActiveTab('learn')}
            className="px-6 py-3 rounded-xl font-headline font-bold text-[.85rem] cursor-pointer
              bg-sea/15 border border-sea/30 text-sea hover:bg-sea/25 transition-colors">
            Start Foundations Course
          </button>
          <button onClick={() => setActiveTab('regulation')}
            className="px-6 py-3 rounded-xl font-headline font-bold text-[.85rem] cursor-pointer
              bg-transparent border border-border text-muted hover:text-txt hover:border-white/20 transition-colors">
            Check Your Country's Laws
          </button>
        </div>
      </div>
    </div>
  );
}
