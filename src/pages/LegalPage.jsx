import { useState } from 'react';
import { TERMS_OF_SERVICE, PRIVACY_POLICY, RISK_DISCLOSURE, LEGAL_LAST_UPDATED } from '../data/legal';

const TABS = [
  { id: 'terms', label: 'Terms of Service', data: TERMS_OF_SERVICE },
  { id: 'privacy', label: 'Privacy Policy', data: PRIVACY_POLICY },
  { id: 'risk', label: 'Risk Disclosure', data: RISK_DISCLOSURE },
];

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState('terms');
  const current = TABS.find(t => t.id === activeTab);

  return (
    <div>
      {/* Hero */}
      <div
        className="rounded-xl p-9 mb-7 border border-sea/20"
        style={{ background: 'linear-gradient(135deg, var(--color-card) 0%, #0a1628 100%)' }}
      >
        <h1 className="font-headline text-[2.4rem] font-black text-txt mb-2">
          Legal
        </h1>
        <p className="text-txt-2 text-[.92rem] font-body max-w-2xl">
          Transparency and trust are core to Limers Capital. Please review our Terms of Service,
          Privacy Policy, and Risk Disclosure carefully before using the platform.
        </p>
        <p className="text-muted text-[.72rem] font-body mt-3">
          Last updated: {LEGAL_LAST_UPDATED}
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2.5 rounded-xl text-[.82rem] font-body font-bold cursor-pointer transition-all"
            style={{
              background: activeTab === tab.id ? 'var(--color-sea)' : 'var(--color-card)',
              color: activeTab === tab.id ? '#000' : 'var(--color-txt-2)',
              border: `1px solid ${activeTab === tab.id ? 'var(--color-sea)' : 'var(--color-border)'}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        className="rounded-xl border border-border p-6 md:p-9"
        style={{ background: 'var(--color-card)' }}
      >
        <h2 className="font-headline text-[1.4rem] font-bold text-txt mb-6">
          {current.data.title}
        </h2>

        {current.data.sections.map((section, i) => (
          <div key={i} className="mb-6 last:mb-0">
            <h3 className="font-headline text-[.95rem] font-bold text-sea mb-2">
              {section.heading}
            </h3>
            <p className="text-txt-2 text-[.84rem] font-body leading-relaxed whitespace-pre-line">
              {section.body}
            </p>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="mt-6 text-center text-muted text-[.72rem] font-body">
        For questions, contact legal@limerscapital.com
      </div>
    </div>
  );
}
