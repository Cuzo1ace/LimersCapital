import CorridorCalculator from '../../apps/pusd-sundollar/src/components/CorridorCalculator.jsx';
import { STABLECOINS } from '../../apps/pusd-sundollar/src/stablecoins.js';
import SendPanel from '../components/send/SendPanel.jsx';
import DevnetHelpers from '../components/send/DevnetHelpers.jsx';

/**
 * /send — the Send Juice surface inside Limer's SPA.
 *
 * Imports the corridor calculator + rail registry directly from the
 * apps/pusd-sundollar/ scaffold so the standalone hackathon demo and the
 * in-app surface stay in lockstep. Tailwind v4 auto-discovers the imported
 * JSX, and the CSS variables (--color-pusd / --color-uae / --color-carib /
 * --color-juice) are declared in src/index.css so the imported component
 * renders with the right brand accents.
 */
export default function SendPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="flex items-start gap-4">
        <img
          src="/send-juice-icon.png"
          alt=""
          aria-hidden="true"
          className="w-14 h-14 flex-shrink-0"
          style={{ imageRendering: 'pixelated' }}
        />
        <div>
          <h1 className="text-[1.6rem] sm:text-[1.9rem] font-headline font-bold leading-tight">
            Send <span className="text-[#7ED957]">Juice</span>
          </h1>
          <p className="text-[var(--color-txt-2)] text-[.85rem] leading-relaxed mt-1 max-w-xl">
            UAE ↔ Caribbean stablecoin corridor on Solana. Pick a Juice rail, see the savings vs traditional cross-border rails, then send <span className="text-[var(--color-pusd)] font-bold">PUSD</span> in under a second.
          </p>
        </div>
      </header>

      <CorridorCalculator />

      <DevnetHelpers />

      <SendPanel />

      <section className="rounded-[14px] p-5 border border-[var(--color-border)]" style={{ background: 'var(--color-card)' }}>
        <div className="text-[.66rem] uppercase tracking-widest mb-2 text-coral">
          Juice rails
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STABLECOINS.map((s) => (
            <div key={s.id} className="rounded-lg border border-[var(--color-border)] p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-[.85rem]" style={{ color: s.color }}>{s.symbol}</span>
                <span className="text-[.6rem] text-muted">{s.issuer}</span>
              </div>
              <p className="text-[.7rem] text-txt-2 leading-relaxed">{s.notes}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[14px] p-5 border border-[var(--color-border)]" style={{ background: 'var(--color-card)' }}>
        <div className="text-[.66rem] uppercase tracking-widest mb-2 text-sea">Hackathon track stack</div>
        <ul className="text-[.78rem] text-txt-2 space-y-1">
          <li>• <span className="text-[var(--color-pusd)] font-bold">Palm USD</span> — primary rail (UAE-issued, Solana Token-2022).</li>
          <li>• <span className="text-coral font-bold">Metaplex Core</span> — programmable savings receipt as a Core NFT.</li>
          <li>• <span className="text-sun font-bold">Privy</span> — embedded wallet onboarding for non-crypto-native diaspora users.</li>
          <li>• <span className="text-up font-bold">Arcium</span> — confidential recipient handles + hidden balances.</li>
          <li>• <span className="text-warn font-bold">MoneyGram / MoonPay</span> — fiat on/off-ramp at the corridor edges.</li>
        </ul>
      </section>
    </div>
  );
}
