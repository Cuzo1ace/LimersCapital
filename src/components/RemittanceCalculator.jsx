import { useState, useMemo } from 'react';

/**
 * Caribbean Remittance Calculator
 * Compares traditional remittance costs (Western Union, MoneyGram)
 * vs. Solana USDC transfers to show real savings.
 */

const CARIBBEAN_COUNTRIES = [
  { code: 'JM', name: 'Jamaica', currency: 'JMD', flag: '🇯🇲', fxRate: 156.50 },
  { code: 'TT', name: 'Trinidad & Tobago', currency: 'TTD', flag: '🇹🇹', fxRate: 6.79 },
  { code: 'GY', name: 'Guyana', currency: 'GYD', flag: '🇬🇾', fxRate: 209.50 },
  { code: 'BB', name: 'Barbados', currency: 'BBD', flag: '🇧🇧', fxRate: 2.02 },
  { code: 'BS', name: 'Bahamas', currency: 'BSD', flag: '🇧🇸', fxRate: 1.00 },
  { code: 'BZ', name: 'Belize', currency: 'BZD', flag: '🇧🇿', fxRate: 2.02 },
  { code: 'HT', name: 'Haiti', currency: 'HTG', flag: '🇭🇹', fxRate: 132.80 },
  { code: 'DO', name: 'Dominican Republic', currency: 'DOP', flag: '🇩🇴', fxRate: 58.70 },
  { code: 'SR', name: 'Suriname', currency: 'SRD', flag: '🇸🇷', fxRate: 36.20 },
  { code: 'LC', name: 'St. Lucia', currency: 'XCD', flag: '🇱🇨', fxRate: 2.70 },
  { code: 'GD', name: 'Grenada', currency: 'XCD', flag: '🇬🇩', fxRate: 2.70 },
  { code: 'AG', name: 'Antigua & Barbuda', currency: 'XCD', flag: '🇦🇬', fxRate: 2.70 },
  { code: 'DM', name: 'Dominica', currency: 'XCD', flag: '🇩🇲', fxRate: 2.70 },
  { code: 'KN', name: 'St. Kitts & Nevis', currency: 'XCD', flag: '🇰🇳', fxRate: 2.70 },
  { code: 'VC', name: 'St. Vincent', currency: 'XCD', flag: '🇻🇨', fxRate: 2.70 },
];

const SEND_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
];

// Typical traditional remittance fee structures (based on World Bank Remittance Prices data)
const TRADITIONAL_PROVIDERS = [
  {
    name: 'Western Union',
    icon: '🟡',
    getFee: (amount) => {
      if (amount <= 100) return 9.99;
      if (amount <= 200) return 14.99;
      if (amount <= 500) return 19.99;
      if (amount <= 1000) return 29.99;
      return amount * 0.035; // ~3.5% for larger amounts
    },
    fxMarkup: 0.025, // 2.5% FX spread markup
    speed: '1-3 days',
  },
  {
    name: 'MoneyGram',
    icon: '🔵',
    getFee: (amount) => {
      if (amount <= 100) return 7.99;
      if (amount <= 200) return 11.99;
      if (amount <= 500) return 16.99;
      if (amount <= 1000) return 24.99;
      return amount * 0.03;
    },
    fxMarkup: 0.02,
    speed: '1-3 days',
  },
  {
    name: 'Bank Wire',
    icon: '🏦',
    getFee: (amount) => {
      return Math.max(25, amount * 0.01); // $25 min or 1%
    },
    fxMarkup: 0.03,
    speed: '3-5 days',
  },
];

const SOLANA_FEE = 0.00025; // ~$0.00025 per transaction
const SOLANA_SPEED = '< 1 second';
const USDC_ON_OFF_RAMP_FEE = 0.015; // ~1.5% typical on/off-ramp fee

export default function RemittanceCalculator() {
  const [amount, setAmount] = useState(500);
  const [fromCountry, setFromCountry] = useState('US');
  const [toCountry, setToCountry] = useState('JM');
  const [showDetails, setShowDetails] = useState(false);

  const dest = CARIBBEAN_COUNTRIES.find(c => c.code === toCountry);
  const from = SEND_COUNTRIES.find(c => c.code === fromCountry);

  const results = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    if (amt <= 0 || !dest) return null;

    const traditional = TRADITIONAL_PROVIDERS.map(p => {
      const fee = p.getFee(amt);
      const fxLoss = amt * p.fxMarkup;
      const totalCost = fee + fxLoss;
      const received = (amt - fee) * dest.fxRate * (1 - p.fxMarkup);
      return {
        ...p,
        fee,
        fxLoss,
        totalCost,
        totalPercent: (totalCost / amt * 100),
        received,
      };
    });

    // Solana USDC: network fee + on/off-ramp fee
    const onOffRampFee = amt * USDC_ON_OFF_RAMP_FEE;
    const solanaTotalCost = SOLANA_FEE + onOffRampFee;
    const solanaReceived = (amt - solanaTotalCost) * dest.fxRate;

    const bestTraditional = Math.min(...traditional.map(t => t.totalCost));
    const savings = bestTraditional - solanaTotalCost;

    return { traditional, solanaTotalCost, solanaReceived, onOffRampFee, savings, amt };
  }, [amount, dest]);

  return (
    <div className="rounded-[14px] p-5 border border-border" style={{ background: 'var(--color-card)' }}>
      <div className="text-[.66rem] uppercase tracking-widest mb-1 flex items-center gap-2 text-palm">
        💸 Caribbean Remittance Calculator
        <span className="text-muted text-[.6rem] font-normal normal-case tracking-normal">Solana vs Traditional</span>
      </div>
      <p className="text-[.72rem] text-txt-2 mb-4 leading-relaxed">
        Caribbean diaspora sends <span className="text-sea font-bold">$20B+/year</span> in remittances.
        See how much you save sending money home via Solana USDC.
      </p>

      {/* Input controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
        {/* Amount */}
        <div>
          <label className="text-[.6rem] text-muted uppercase tracking-widest block mb-1">Amount (USD)</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted text-[.75rem]">$</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="1"
              max="10000"
              className="w-full bg-black/30 border border-border text-txt rounded-lg pl-6 pr-3 py-2 font-mono text-[.8rem] outline-none focus:border-sea/50"
            />
          </div>
        </div>

        {/* From */}
        <div>
          <label className="text-[.6rem] text-muted uppercase tracking-widest block mb-1">Send From</label>
          <select
            value={fromCountry}
            onChange={e => setFromCountry(e.target.value)}
            className="w-full bg-black/30 border border-border text-txt rounded-lg px-3 py-2 font-mono text-[.75rem] outline-none focus:border-sea/50"
          >
            {SEND_COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </select>
        </div>

        {/* To */}
        <div>
          <label className="text-[.6rem] text-muted uppercase tracking-widest block mb-1">Send To</label>
          <select
            value={toCountry}
            onChange={e => setToCountry(e.target.value)}
            className="w-full bg-black/30 border border-border text-txt rounded-lg px-3 py-2 font-mono text-[.75rem] outline-none focus:border-sea/50"
          >
            {CARIBBEAN_COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick amount buttons */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {[100, 200, 500, 1000, 2000, 5000].map(v => (
          <button
            key={v}
            onClick={() => setAmount(v)}
            className={`px-3 py-1 rounded-lg text-[.7rem] font-mono cursor-pointer border transition-all
              ${parseFloat(amount) === v
                ? 'bg-sea/15 border-sea/40 text-sea font-bold'
                : 'bg-transparent border-border text-muted hover:text-txt hover:border-white/20'}`}
          >
            ${v.toLocaleString()}
          </button>
        ))}
      </div>

      {results && results.amt > 0 && (
        <>
          {/* Solana USDC — highlighted winner */}
          <div
            className="rounded-xl p-4 mb-3 border border-up/30 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(0,255,163,.06) 0%, rgba(0,255,163,.02) 100%)' }}
          >
            <div className="absolute top-2 right-3 bg-up/15 border border-up/30 rounded-full px-2 py-0.5 text-[.55rem] text-up font-bold uppercase tracking-wider">
              Best Value
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-up/15 flex items-center justify-center text-lg">⚡</div>
              <div>
                <div className="font-body font-bold text-[.88rem] text-up">Solana USDC</div>
                <div className="text-[.62rem] text-up/70">{SOLANA_SPEED} · Borderless · 24/7</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-[.58rem] text-muted uppercase tracking-widest mb-0.5">Total Fee</div>
                <div className="font-body font-bold text-[1rem] text-up">${results.solanaTotalCost.toFixed(2)}</div>
                <div className="text-[.6rem] text-up/60">{(results.solanaTotalCost / results.amt * 100).toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-[.58rem] text-muted uppercase tracking-widest mb-0.5">They Receive</div>
                <div className="font-body font-bold text-[1rem] text-txt">
                  {dest.currency} {results.solanaReceived.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div>
                <div className="text-[.58rem] text-muted uppercase tracking-widest mb-0.5">You Save</div>
                <div className="font-body font-bold text-[1rem] text-sun">
                  ${results.savings.toFixed(2)}
                </div>
                <div className="text-[.6rem] text-sun/70">vs cheapest traditional</div>
              </div>
            </div>
          </div>

          {/* Traditional providers */}
          <div className="flex flex-col gap-2">
            {results.traditional.map(p => (
              <div key={p.name}
                className="rounded-xl p-3.5 border border-border flex items-center gap-3"
                style={{ background: 'rgba(0,0,0,.15)' }}
              >
                <div className="text-xl w-8 text-center flex-shrink-0">{p.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-body font-bold text-[.78rem] text-txt">{p.name}</div>
                  <div className="text-[.6rem] text-muted">{p.speed}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-body font-bold text-[.82rem] text-down">${p.totalCost.toFixed(2)}</div>
                  <div className="text-[.6rem] text-down/70">{p.totalPercent.toFixed(1)}% total cost</div>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <div className="text-[.72rem] text-txt-2">
                    {dest.currency} {p.received.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[.58rem] text-muted">received</div>
                </div>
              </div>
            ))}
          </div>

          {/* Expand details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-3 bg-transparent border-none text-sea text-[.7rem] cursor-pointer font-mono hover:underline p-0"
          >
            {showDetails ? '▾ Hide details' : '▸ Show fee breakdown'}
          </button>

          {showDetails && (
            <div className="mt-2 rounded-lg border border-border p-3 text-[.7rem]" style={{ background: 'rgba(0,0,0,.2)' }}>
              <div className="grid grid-cols-5 gap-1 mb-2 text-[.58rem] text-muted uppercase tracking-widest">
                <span>Provider</span><span>Transfer Fee</span><span>FX Markup</span><span>Total Cost</span><span>% of Send</span>
              </div>
              {results.traditional.map(p => (
                <div key={p.name} className="grid grid-cols-5 gap-1 py-1 border-b border-white/5 text-txt-2">
                  <span>{p.name}</span>
                  <span>${p.fee.toFixed(2)}</span>
                  <span>${p.fxLoss.toFixed(2)}</span>
                  <span className="text-down font-bold">${p.totalCost.toFixed(2)}</span>
                  <span>{p.totalPercent.toFixed(1)}%</span>
                </div>
              ))}
              <div className="grid grid-cols-5 gap-1 py-1 text-up font-bold">
                <span>Solana USDC</span>
                <span>${SOLANA_FEE.toFixed(4)}</span>
                <span>${results.onOffRampFee.toFixed(2)}</span>
                <span>${results.solanaTotalCost.toFixed(2)}</span>
                <span>{(results.solanaTotalCost / results.amt * 100).toFixed(2)}%</span>
              </div>
              <div className="mt-2 text-[.6rem] text-muted">
                * Solana on/off-ramp fee assumes ~1.5% via exchanges like Coinbase/MoonPay. Network fee is ~$0.00025.
                Traditional FX markup is the hidden spread between interbank and retail exchange rates.
              </div>
            </div>
          )}

          {/* Annual savings projection */}
          <div className="mt-4 rounded-xl p-4 border border-sea/15" style={{ background: 'rgba(56,189,248,.04)' }}>
            <div className="text-[.65rem] text-sea uppercase tracking-widest mb-2">💡 Annual Savings Projection</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-[.58rem] text-muted mb-0.5">Monthly ({from?.flag}→{dest?.flag})</div>
                <div className="font-body font-bold text-[.88rem] text-txt">${results.amt.toLocaleString()}/mo</div>
              </div>
              <div>
                <div className="text-[.58rem] text-muted mb-0.5">Annual Savings</div>
                <div className="font-body font-bold text-[.88rem] text-sun">${(results.savings * 12).toFixed(0)}/yr</div>
              </div>
              <div>
                <div className="text-[.58rem] text-muted mb-0.5">Caribbean Diaspora</div>
                <div className="font-body font-bold text-[.88rem] text-sea">$20B+/yr</div>
                <div className="text-[.55rem] text-muted">total remittances</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
