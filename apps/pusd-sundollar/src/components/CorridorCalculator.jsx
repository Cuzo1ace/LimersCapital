import { useState, useMemo } from 'react';
import { STABLECOINS, DEFAULT_STABLECOIN_ID, getStablecoin } from '../stablecoins.js';

/**
 * Send Juice — Corridor Calculator
 *
 * Drop-in successor to Limer's RemittanceCalculator, retargeted at the
 * UAE → Caribbean corridor and parameterised on the Juice rail registry
 * so a new rail (PUSD today, USDPT tomorrow) is one config row away.
 */

const DEST_COUNTRIES = [
  { code: 'TT', name: 'Trinidad & Tobago', currency: 'TTD', flag: '🇹🇹', fxRate: 6.79 },
  { code: 'JM', name: 'Jamaica', currency: 'JMD', flag: '🇯🇲', fxRate: 156.50 },
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

const SOURCE_COUNTRIES = [
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', usdPerUnit: 0.272 }, // 1 AED ≈ 0.272 USD
  { code: 'SA', name: 'Saudi Arabia',         flag: '🇸🇦', usdPerUnit: 0.267 },
  { code: 'QA', name: 'Qatar',                flag: '🇶🇦', usdPerUnit: 0.275 },
  { code: 'KW', name: 'Kuwait',               flag: '🇰🇼', usdPerUnit: 3.260 },
];

// Tradfi cross-border rails we benchmark Send Juice against. Western Union is
// intentionally absent — Palm USD's roadmap has WU's USDPT as a future Juice
// rail, so positioning WU as the villain would age badly. Remitly + MoneyGram
// + a generic SWIFT bank wire give a representative competitor spread without
// burning a likely partner.
const TRADITIONAL_PROVIDERS = [
  {
    name: 'Remitly',
    iconClass: 'text-warn',
    getFee: (amount) => {
      if (amount <= 100) return 3.99;
      if (amount <= 500) return 4.99;
      if (amount <= 1000) return 7.99;
      return amount * 0.018;
    },
    fxMarkup: 0.018,
    speed: 'Hours – 3 days',
  },
  {
    name: 'MoneyGram',
    iconClass: 'text-sea',
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
    name: 'SWIFT Bank Wire',
    iconClass: 'text-txt-2',
    getFee: (amount) => Math.max(25, amount * 0.01),
    fxMarkup: 0.03,
    speed: '3-5 days',
  },
];

const SOLANA_NETWORK_FEE_USD = 0.00025;
const SOLANA_SPEED = '< 1 second';
const ON_OFF_RAMP_FEE = 0.015; // ~1.5% blended on/off-ramp assumption

export default function CorridorCalculator() {
  const [stablecoinId, setStablecoinId] = useState(DEFAULT_STABLECOIN_ID);
  const [amountUsd, setAmountUsd] = useState(500);
  const [fromCountry, setFromCountry] = useState('AE');
  const [toCountry, setToCountry] = useState('TT');
  const [showDetails, setShowDetails] = useState(false);

  const stablecoin = getStablecoin(stablecoinId);
  const dest = DEST_COUNTRIES.find((c) => c.code === toCountry);
  const from = SOURCE_COUNTRIES.find((c) => c.code === fromCountry);

  const results = useMemo(() => {
    const amt = parseFloat(amountUsd) || 0;
    if (amt <= 0 || !dest) return null;

    const traditional = TRADITIONAL_PROVIDERS.map((p) => {
      const fee = p.getFee(amt);
      const fxLoss = amt * p.fxMarkup;
      const totalCost = fee + fxLoss;
      const received = (amt - fee) * dest.fxRate * (1 - p.fxMarkup);
      return {
        ...p,
        fee,
        fxLoss,
        totalCost,
        totalPercent: (totalCost / amt) * 100,
        received,
      };
    });

    const onOffRampFee = amt * ON_OFF_RAMP_FEE;
    const solanaTotalCost = SOLANA_NETWORK_FEE_USD + onOffRampFee;
    const solanaReceived = (amt - solanaTotalCost) * dest.fxRate;

    const bestTraditional = Math.min(...traditional.map((t) => t.totalCost));
    const savings = bestTraditional - solanaTotalCost;

    return { traditional, solanaTotalCost, solanaReceived, onOffRampFee, savings, amt };
  }, [amountUsd, dest]);

  return (
    <div className="rounded-[14px] p-5 border border-[var(--color-border)]" style={{ background: 'var(--color-card)' }}>
      <div className="text-[.66rem] uppercase tracking-widest mb-1 flex items-center gap-2" style={{ color: stablecoin.color }}>
        Corridor Calculator
        <span className="text-[var(--color-muted)] text-[.6rem] font-normal normal-case tracking-normal">
          {stablecoin.symbol} on Solana vs traditional rails
        </span>
      </div>
      <p className="text-[.72rem] text-[var(--color-txt-2)] mb-4 leading-relaxed">
        UAE-based diaspora sends billions home each year. See what {stablecoin.symbol} on Solana costs vs traditional cross-border rails — Remitly, MoneyGram, SWIFT bank wire.
      </p>

      {/* Rail picker — issuer-agnostic by design */}
      <div className="mb-4">
        <label className="text-[.6rem] text-[var(--color-muted)] uppercase tracking-widest block mb-1.5">Rail</label>
        <div className="flex gap-1.5 flex-wrap">
          {STABLECOINS.map((s) => (
            <button
              key={s.id}
              onClick={() => setStablecoinId(s.id)}
              className={`px-3 py-1.5 rounded-lg text-[.7rem] font-mono cursor-pointer border transition-colors duration-150 ${
                s.id === stablecoinId
                  ? 'bg-white/5 text-[var(--color-txt)] font-bold'
                  : 'bg-transparent border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-txt)]'
              }`}
              style={s.id === stablecoinId ? { borderColor: s.color, color: s.color } : undefined}
              title={s.notes}
            >
              {s.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Amount + countries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
        <div>
          <label className="text-[.6rem] text-[var(--color-muted)] uppercase tracking-widest block mb-1">Amount (USD)</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-[.75rem]">$</span>
            <input
              type="number"
              value={amountUsd}
              onChange={(e) => setAmountUsd(e.target.value)}
              min="1"
              max="10000"
              className="w-full bg-black/30 border border-[var(--color-border)] text-[var(--color-txt)] rounded-lg pl-6 pr-3 py-2 font-mono text-[.8rem] outline-none focus:border-[var(--color-sea)]"
            />
          </div>
        </div>

        <div>
          <label className="text-[.6rem] text-[var(--color-muted)] uppercase tracking-widest block mb-1">Sender (UAE/Gulf)</label>
          <select
            value={fromCountry}
            onChange={(e) => setFromCountry(e.target.value)}
            className="w-full bg-black/30 border border-[var(--color-border)] text-[var(--color-txt)] rounded-lg px-3 py-2 font-mono text-[.75rem] outline-none focus:border-[var(--color-sea)]"
          >
            {SOURCE_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[.6rem] text-[var(--color-muted)] uppercase tracking-widest block mb-1">Recipient (Caribbean)</label>
          <select
            value={toCountry}
            onChange={(e) => setToCountry(e.target.value)}
            className="w-full bg-black/30 border border-[var(--color-border)] text-[var(--color-txt)] rounded-lg px-3 py-2 font-mono text-[.75rem] outline-none focus:border-[var(--color-sea)]"
          >
            {DEST_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-1.5 mb-5 flex-wrap">
        {[100, 200, 500, 1000, 2000, 5000].map((v) => (
          <button
            key={v}
            onClick={() => setAmountUsd(v)}
            className={`px-3 py-1 rounded-lg text-[.7rem] font-mono cursor-pointer border transition-colors duration-150 ${
              parseFloat(amountUsd) === v
                ? 'bg-[var(--color-sea)]/15 border-[var(--color-sea)]/40 text-[var(--color-sea)] font-bold'
                : 'bg-transparent border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-txt)]'
            }`}
          >
            ${v.toLocaleString()}
          </button>
        ))}
      </div>

      {results && results.amt > 0 && (
        <>
          <div
            className="rounded-xl p-4 mb-3 border border-[var(--color-up)]/30 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-up) 6%, transparent) 0%, color-mix(in srgb, var(--color-up) 2%, transparent) 100%)',
            }}
          >
            <div className="absolute top-2 right-3 bg-[var(--color-up)]/15 border border-[var(--color-up)]/30 rounded-full px-2 py-0.5 text-[.55rem] text-[var(--color-up)] font-bold uppercase tracking-wider">
              Best Value
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[var(--color-up)]/15 flex items-center justify-center text-[var(--color-up)] font-bold">
                {stablecoin.symbol[0]}
              </div>
              <div>
                <div className="font-bold text-[.88rem] text-[var(--color-up)]">
                  {stablecoin.symbol} on Solana
                </div>
                <div className="text-[.62rem] text-[var(--color-up)]/70">
                  {SOLANA_SPEED} · {stablecoin.issuer} · 24/7
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-[.58rem] text-[var(--color-muted)] uppercase tracking-widest mb-0.5">Total Fee</div>
                <div className="font-bold text-[1rem] text-[var(--color-up)]">${results.solanaTotalCost.toFixed(2)}</div>
                <div className="text-[.6rem] text-[var(--color-up)]/60">{(results.solanaTotalCost / results.amt * 100).toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-[.58rem] text-[var(--color-muted)] uppercase tracking-widest mb-0.5">They Receive</div>
                <div className="font-bold text-[1rem] text-[var(--color-txt)]">
                  {dest.currency} {results.solanaReceived.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div>
                <div className="text-[.58rem] text-[var(--color-muted)] uppercase tracking-widest mb-0.5">You Save</div>
                <div className="font-bold text-[1rem] text-[var(--color-sun)]">${results.savings.toFixed(2)}</div>
                <div className="text-[.6rem] text-[var(--color-sun)]/70">vs cheapest traditional</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {results.traditional.map((p) => (
              <div
                key={p.name}
                className="rounded-xl p-3.5 border border-[var(--color-border)] flex items-center gap-3"
                style={{ background: 'var(--color-card)' }}
              >
                <div className={`w-8 flex-shrink-0 flex justify-center font-bold text-[.85rem] ${p.iconClass}`}>•</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[.78rem] text-[var(--color-txt)]">{p.name}</div>
                  <div className="text-[.6rem] text-[var(--color-muted)]">{p.speed}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-[.82rem] text-[var(--color-down)]">${p.totalCost.toFixed(2)}</div>
                  <div className="text-[.6rem] text-[var(--color-down)]/70">{p.totalPercent.toFixed(1)}% total cost</div>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <div className="text-[.72rem] text-[var(--color-txt-2)]">
                    {dest.currency} {p.received.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[.58rem] text-[var(--color-muted)]">received</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-3 bg-transparent border-none text-[var(--color-sea)] text-[.7rem] cursor-pointer font-mono hover:underline p-0"
          >
            {showDetails ? '▾ Hide details' : '▸ Show fee breakdown'}
          </button>

          {showDetails && (
            <div className="mt-2 rounded-lg border border-[var(--color-border)] p-3 text-[.7rem]" style={{ background: 'var(--color-card)' }}>
              <div className="grid grid-cols-5 gap-1 mb-2 text-[.58rem] text-[var(--color-muted)] uppercase tracking-widest">
                <span>Provider</span><span>Transfer Fee</span><span>FX Markup</span><span>Total Cost</span><span>% of Send</span>
              </div>
              {results.traditional.map((p) => (
                <div key={p.name} className="grid grid-cols-5 gap-1 py-1 border-b border-[var(--color-border)] text-[var(--color-txt-2)]">
                  <span>{p.name}</span>
                  <span>${p.fee.toFixed(2)}</span>
                  <span>${p.fxLoss.toFixed(2)}</span>
                  <span className="text-[var(--color-down)] font-bold">${p.totalCost.toFixed(2)}</span>
                  <span>{p.totalPercent.toFixed(1)}%</span>
                </div>
              ))}
              <div className="grid grid-cols-5 gap-1 py-1 text-[var(--color-up)] font-bold">
                <span>{stablecoin.symbol} on Solana</span>
                <span>${SOLANA_NETWORK_FEE_USD.toFixed(4)}</span>
                <span>${results.onOffRampFee.toFixed(2)}</span>
                <span>${results.solanaTotalCost.toFixed(2)}</span>
                <span>{(results.solanaTotalCost / results.amt * 100).toFixed(2)}%</span>
              </div>
              <div className="mt-2 text-[.6rem] text-[var(--color-muted)]">
                * On/off-ramp fee is a blended ~1.5% assumption (MoonPay tier expected at launch). Network fee is the typical Solana priority-fee envelope. Traditional FX markup is the hidden interbank-vs-retail spread.
              </div>
            </div>
          )}

          <div
            className="mt-4 rounded-xl p-4 border border-[var(--color-sea)]/15"
            style={{ background: 'color-mix(in srgb, var(--color-sea) 4%, transparent)' }}
          >
            <div className="text-[.65rem] text-[var(--color-sea)] uppercase tracking-widest mb-2">
              Annual Savings Projection
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-[.58rem] text-[var(--color-muted)] mb-0.5">Monthly ({from?.flag}→{dest?.flag})</div>
                <div className="font-bold text-[.88rem] text-[var(--color-txt)]">${results.amt.toLocaleString()}/mo</div>
              </div>
              <div>
                <div className="text-[.58rem] text-[var(--color-muted)] mb-0.5">Annual Savings</div>
                <div className="font-bold text-[.88rem] text-[var(--color-sun)]">${(results.savings * 12).toFixed(0)}/yr</div>
              </div>
              <div>
                <div className="text-[.58rem] text-[var(--color-muted)] mb-0.5">Caribbean Diaspora</div>
                <div className="font-bold text-[.88rem] text-[var(--color-sea)]">$20B+/yr</div>
                <div className="text-[.55rem] text-[var(--color-muted)]">total inbound remittances</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
