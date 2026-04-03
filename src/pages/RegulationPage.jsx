import { useState } from 'react';
import CaribbeanCryptoMap from '../CaribbeanCryptoMap';
import { TERMS_OF_SERVICE, PRIVACY_POLICY, RISK_DISCLOSURE, LEGAL_LAST_UPDATED } from '../data/legal';
import { COUNTRIES, STATUS } from '../data/regulations';

const LEGAL_TABS = [
  { id: 'terms', label: 'Terms of Service', icon: '📜', data: TERMS_OF_SERVICE },
  { id: 'privacy', label: 'Privacy Policy', icon: '🔒', data: PRIVACY_POLICY },
  { id: 'risk', label: 'Risk Disclosure', icon: '⚠️', data: RISK_DISCLOSURE },
];

export default function RegulationPage() {
  const [view, setView] = useState('map'); // 'map' | 'legal'
  const [legalTab, setLegalTab] = useState('terms');
  const [selectedCountry, setSelectedCountry] = useState('');
  const currentLegal = LEGAL_TABS.find(t => t.id === legalTab);
  const countryInfo = COUNTRIES.find(c => c.id === selectedCountry);
  const countryStatus = countryInfo ? STATUS[countryInfo.status] : null;

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
          {/* "Is crypto legal where I live?" Quick Checker */}
          <div className="rounded-xl border border-sea/20 p-5 mb-6"
            style={{ background: 'linear-gradient(135deg, rgba(0,255,163,.06) 0%, var(--color-card) 100%)' }}>
            <h2 className="font-headline text-[1.1rem] font-black text-txt mb-3">
              🔍 Is crypto legal where I live?
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={selectedCountry}
                onChange={e => setSelectedCountry(e.target.value)}
                className="bg-black/30 border border-border text-txt rounded-lg px-3 py-2 font-body text-[.8rem] outline-none
                  cursor-pointer min-w-[200px] focus:border-sea/50"
              >
                <option value="">Select your country...</option>
                {COUNTRIES.map(c => (
                  <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
                ))}
              </select>
              {countryInfo && countryStatus && (
                <span className="px-3 py-1.5 rounded-lg text-[.72rem] font-bold border"
                  style={{ color: countryStatus.color, borderColor: countryStatus.border, background: countryStatus.bg }}>
                  {countryStatus.label}
                </span>
              )}
            </div>

            {countryInfo && countryStatus && (
              <div className="mt-4 rounded-lg border border-border p-4" style={{ background: 'var(--color-card)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{countryInfo.flag}</span>
                  <h3 className="font-body font-bold text-[.92rem] text-txt">{countryInfo.name}</h3>
                </div>
                <p className="text-[.78rem] text-txt-2 leading-relaxed mb-3">{countryInfo.details}</p>
                {countryInfo.law && (
                  <div className="text-[.7rem] text-muted">
                    <strong>Key legislation:</strong> {countryInfo.law}
                  </div>
                )}
                {countryInfo.sources && (
                  <div className="text-[.6rem] text-muted mt-2">
                    Sources: {countryInfo.sources.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>

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
