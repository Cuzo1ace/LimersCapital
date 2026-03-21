import { useState } from 'react';
import useStore from '../store/useStore';
import { LISTING_TIERS, LISTING_BENEFITS, LISTING_FAQ } from '../data/listings';
import { TTSE_FALLBACK } from '../api/ttse';

export default function ListingPage() {
  const { submitListingApplication, listingApplications } = useStore();
  const [form, setForm] = useState({ company: '', contact: '', email: '', tier: 'Explorer', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.company || !form.email) return;
    submitListingApplication(form);
    setSubmitted(true);
  }

  return (
    <div>
      {/* Hero */}
      <div className="rounded-xl p-9 mb-7 border border-[rgba(200,16,46,.22)] text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(200,16,46,.06), rgba(0,255,163,.04))' }}>
        <div className="absolute right-4 bottom-[-20px] text-[120px] opacity-10 pointer-events-none select-none">🏛️</div>
        <div className="inline-block bg-[rgba(200,16,46,.12)] border border-[rgba(200,16,46,.3)] rounded-full text-[.68rem] text-[#FF4D6D] px-3 py-0.5 tracking-widest uppercase mb-3">
          Institutional Listings
        </div>
        <h1 className="font-headline text-[2.4rem] font-black text-txt mb-3">
          Bring Your Company to the<br /><span className="text-sea">Future of Caribbean Finance</span>
        </h1>
        <p className="font-body text-txt-2 text-[.82rem] leading-relaxed max-w-2xl mx-auto">
          Tokenize your TTSE-listed stock on Solana. Give global investors 24/7 access, fractional ownership, and instant settlement — while you gain liquidity and a new generation of shareholders.
        </p>
      </div>

      {/* Benefits */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Why List on Limer's Capital?</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 mb-7">
        {LISTING_BENEFITS.map(b => (
          <div key={b.title} className="rounded-xl border border-border p-5" style={{ background: 'var(--color-card)' }}>
            <div className="text-2xl mb-2">{b.icon}</div>
            <div className="font-body font-bold text-[.84rem] text-txt mb-1">{b.title}</div>
            <div className="text-[.72rem] text-txt-2 leading-relaxed">{b.desc}</div>
          </div>
        ))}
      </div>

      {/* Listing Tiers */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Listing Tiers</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
        {LISTING_TIERS.map(t => (
          <div key={t.name} className={`rounded-xl border p-6 flex flex-col relative
            ${t.popular ? 'border-sun/40 ring-1 ring-sun/20' : 'border-border'}`}
            style={{ background: 'var(--color-card)' }}>
            {t.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sun text-night text-[.6rem] font-bold px-3 py-0.5 rounded-full uppercase tracking-widest">
                Most Popular
              </div>
            )}
            <div className="text-3xl mb-2">{t.icon}</div>
            <h3 className="font-body font-bold text-[1.1rem] mb-1" style={{ color: t.color }}>{t.name}</h3>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="font-headline text-[1.8rem] font-black text-txt">{t.price}</span>
              <span className="text-[.68rem] text-muted">/{t.priceNote}</span>
            </div>
            <ul className="flex flex-col gap-2 mt-3 flex-1 mb-4">
              {t.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-[.76rem] text-txt-2">
                  <span className="text-up mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => { setForm({ ...form, tier: t.name }); document.getElementById('listing-form')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="w-full px-4 py-2.5 rounded-xl text-[.82rem] font-body font-bold cursor-pointer border transition-all"
              style={t.popular
                ? { background: t.color, color: 'var(--color-night)', borderColor: t.color }
                : { background: 'transparent', borderColor: 'var(--color-border)', color: t.color }}>
              {t.cta}
            </button>
          </div>
        ))}
      </div>

      {/* TTSE Showcase */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Already Showcased on Our Platform</h2>
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-2 mb-7">
        {TTSE_FALLBACK.slice(0, 16).map(s => (
          <div key={s.sym} className="rounded-xl border border-border p-3 text-center" style={{ background: 'var(--color-card)' }}>
            <div className="font-body font-bold text-[.82rem] text-[#FF4D6D]">{s.sym}</div>
            <div className="text-[.58rem] text-muted truncate">{s.name}</div>
          </div>
        ))}
      </div>

      {/* Application Form */}
      <div id="listing-form">
        <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4">Apply to List</h2>
        {submitted ? (
          <div className="rounded-xl border border-up/30 p-8 text-center bg-up/5">
            <div className="text-3xl mb-3">✅</div>
            <h3 className="font-body font-bold text-[1.1rem] text-up mb-2">Application Submitted!</h3>
            <p className="text-[.82rem] text-txt-2 mb-2">Thank you for your interest. Our team will review your application and be in touch within 48 hours.</p>
            <p className="text-[.75rem] text-[#2D9B56]">+100 LP earned for submitting!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-xl border border-border p-6" style={{ background: 'var(--color-card)' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[.68rem] text-muted uppercase tracking-widest mb-1">Company Name *</label>
                <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                  className="w-full bg-black/30 border border-border text-txt rounded-lg px-4 py-2.5 font-mono text-[.82rem] outline-none focus:border-sea transition-colors"
                  placeholder="e.g. Republic Financial Holdings" required />
              </div>
              <div>
                <label className="block text-[.68rem] text-muted uppercase tracking-widest mb-1">Contact Person</label>
                <input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })}
                  className="w-full bg-black/30 border border-border text-txt rounded-lg px-4 py-2.5 font-mono text-[.82rem] outline-none focus:border-sea transition-colors"
                  placeholder="Name" />
              </div>
              <div>
                <label className="block text-[.68rem] text-muted uppercase tracking-widest mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-black/30 border border-border text-txt rounded-lg px-4 py-2.5 font-mono text-[.82rem] outline-none focus:border-sea transition-colors"
                  placeholder="investor.relations@company.com" required />
              </div>
              <div>
                <label className="block text-[.68rem] text-muted uppercase tracking-widest mb-1">Tier</label>
                <select value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })}
                  className="w-full bg-black/30 border border-border text-txt rounded-lg px-4 py-2.5 font-mono text-[.82rem] outline-none focus:border-sea transition-colors">
                  {LISTING_TIERS.map(t => <option key={t.name} value={t.name}>{t.name} — {t.price}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-[.68rem] text-muted uppercase tracking-widest mb-1">Message</label>
              <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={3}
                className="w-full bg-black/30 border border-border text-txt rounded-lg px-4 py-2.5 font-mono text-[.82rem] outline-none focus:border-sea transition-colors resize-none"
                placeholder="Tell us about your company and tokenization goals..." />
            </div>
            <button type="submit"
              className="px-6 py-3 rounded-xl bg-sea text-night font-body font-bold text-[.88rem] cursor-pointer border-none transition-all hover:brightness-90">
              Submit Application (+100 LP)
            </button>
          </form>
        )}
      </div>

      {/* FAQ */}
      <h2 className="font-headline text-[.92rem] font-bold uppercase tracking-widest text-txt mb-4 mt-7">Frequently Asked Questions</h2>
      <div className="flex flex-col gap-2 mb-7">
        {LISTING_FAQ.map((f, i) => (
          <div key={i} className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--color-card)' }}>
            <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left bg-transparent border-none cursor-pointer text-[.82rem] text-txt font-bold">
              <span>{f.q}</span>
              <span className="text-muted text-lg">{openFaq === i ? '−' : '+'}</span>
            </button>
            {openFaq === i && (
              <div className="px-5 pb-4 text-[.78rem] text-txt-2 leading-relaxed border-t border-border pt-3">
                {f.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
