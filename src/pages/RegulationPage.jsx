import { useState } from 'react';
import CaribbeanCryptoMap from '../CaribbeanCryptoMap';
import { TERMS_OF_SERVICE, PRIVACY_POLICY, RISK_DISCLOSURE, LEGAL_LAST_UPDATED } from '../data/legal';

const LEGAL_TABS = [
  { id: 'terms', label: 'Terms of Service', icon: '📜', data: TERMS_OF_SERVICE },
  { id: 'privacy', label: 'Privacy Policy', icon: '🔒', data: PRIVACY_POLICY },
  { id: 'risk', label: 'Risk Disclosure', icon: '⚠️', data: RISK_DISCLOSURE },
];

export default function RegulationPage() {
  const [view, setView] = useState('map'); // 'map' | 'legal'
  const [legalTab, setLegalTab] = useState('terms');
  const currentLegal = LEGAL_TABS.find(t => t.id === legalTab);

  return (
    <div>
      {/* View toggle bar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <button
          onClick={() => setView('map')}
          className={`px-5 py-2.5 rounded-xl text-[.82rem] font-body font-bold cursor-pointer transition-all border
            ${view === 'map'
              ? 'bg-sea/12 border-sea/30 text-sea'
              : 'bg-transparent border-border text-muted hover:text-txt hover:border-white/15'}`}
        >
          🗺️ Regulation Map
        </button>
        <button
          onClick={() => setView('legal')}
          className={`px-5 py-2.5 rounded-xl text-[.82rem] font-body font-bold cursor-pointer transition-all border
            ${view === 'legal'
              ? 'bg-sea/12 border-sea/30 text-sea'
              : 'bg-transparent border-border text-muted hover:text-txt hover:border-white/15'}`}
        >
          📋 Legal & Compliance
        </button>

        {view === 'legal' && (
          <span className="text-[.65rem] text-muted font-mono ml-auto">
            Last updated: {LEGAL_LAST_UPDATED}
          </span>
        )}
      </div>

      {/* Regulation Map View */}
      {view === 'map' && (
        <>
          <CaribbeanCryptoMap />

          {/* Legal CTA banner */}
          <div
            className="mt-6 rounded-xl border border-sea/15 p-5 flex items-center gap-4 flex-wrap"
            style={{ background: 'linear-gradient(135deg, rgba(0,255,163,.04) 0%, rgba(56,189,248,.03) 100%)' }}
          >
            <div className="flex-1 min-w-[200px]">
              <div className="font-body font-bold text-[.88rem] text-txt mb-1">
                📋 Review Our Legal Terms
              </div>
              <div className="text-[.75rem] text-txt-2">
                Terms of Service, Privacy Policy, and Risk Disclosure — read before you trade.
              </div>
            </div>
            <button
              onClick={() => { setView('legal'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="px-5 py-2.5 rounded-xl text-[.78rem] font-body font-bold cursor-pointer border border-sea/30 bg-sea/8 text-sea hover:bg-sea/15 transition-all shrink-0"
            >
              View Legal Docs →
            </button>
          </div>
        </>
      )}

      {/* Legal & Compliance View */}
      {view === 'legal' && (
        <div>
          {/* Hero */}
          <div
            className="rounded-xl p-7 md:p-9 mb-6 border border-sea/20"
            style={{ background: 'linear-gradient(135deg, var(--color-card) 0%, #0a1628 100%)' }}
          >
            <h1 className="font-headline text-[1.8rem] md:text-[2.2rem] font-black text-txt mb-2">
              Legal & Compliance
            </h1>
            <p className="text-txt-2 text-[.88rem] font-body max-w-2xl">
              Transparency and trust are core to Limers Capital. Review our Terms of Service,
              Privacy Policy, and Risk Disclosure before using the platform.
            </p>
          </div>

          {/* Legal tab bar */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {LEGAL_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setLegalTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-[.8rem] font-body font-bold cursor-pointer transition-all border
                  ${legalTab === tab.id
                    ? 'bg-sea text-night border-sea'
                    : 'bg-transparent text-txt-2 border-border hover:border-sea/30 hover:text-txt'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Legal content */}
          <div
            className="rounded-xl border border-border p-6 md:p-9"
            style={{ background: 'var(--color-card)' }}
          >
            <h2 className="font-headline text-[1.3rem] font-bold text-txt mb-6">
              {currentLegal.data.title}
            </h2>

            {currentLegal.data.sections.map((section, i) => (
              <div key={i} className="mb-6 last:mb-0">
                <h3 className="font-headline text-[.92rem] font-bold text-sea mb-2">
                  {section.heading}
                </h3>
                <p className="text-txt-2 text-[.82rem] font-body leading-relaxed whitespace-pre-line">
                  {section.body}
                </p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-5 text-center text-muted text-[.7rem] font-body">
            For questions, contact legal@limerscapital.com
          </div>
        </div>
      )}
    </div>
  );
}
