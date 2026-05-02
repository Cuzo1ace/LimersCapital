import CorridorCalculator from './components/CorridorCalculator.jsx';
import { STABLECOINS } from './stablecoins.js';

export default function App() {
  return (
    <div className="min-h-full">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-night-2)]/60 backdrop-blur">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-night)] font-bold text-[.85rem]"
              style={{ background: 'linear-gradient(135deg, var(--color-uae), var(--color-carib))' }}
            >
              ☀
            </div>
            <div>
              <div className="font-bold text-[.95rem] leading-tight">Send Juice</div>
              <div className="text-[.6rem] text-[var(--color-muted)] uppercase tracking-widest">UAE ↔ Caribbean stablecoin corridor</div>
            </div>
          </div>
          <div className="text-[.6rem] text-[var(--color-warn)] uppercase tracking-widest border border-[var(--color-warn)]/30 rounded-full px-2 py-1">
            Devnet preview
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-8">
        <section>
          <h1 className="text-[1.4rem] sm:text-[1.65rem] font-bold leading-tight mb-2">
            Send <span style={{ color: 'var(--color-pusd)' }}>PUSD</span> from the Gulf to the Caribbean.
          </h1>
          <p className="text-[var(--color-txt-2)] text-[.85rem] leading-relaxed max-w-xl">
            One stablecoin, two regulated economies. Pick a Juice rail, see the savings, then route the receive into a programmable savings receipt.
          </p>
        </section>

        <CorridorCalculator />

        <section className="rounded-[14px] p-5 border border-[var(--color-border)]" style={{ background: 'var(--color-card)' }}>
          <div className="text-[.66rem] uppercase tracking-widest mb-2 text-[var(--color-coral)]">
            Juice rails
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {STABLECOINS.map((s) => (
              <div key={s.id} className="rounded-lg border border-[var(--color-border)] p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-[.85rem]" style={{ color: s.color }}>{s.symbol}</span>
                  <span className="text-[.6rem] text-[var(--color-muted)]">{s.issuer}</span>
                </div>
                <p className="text-[.7rem] text-[var(--color-txt-2)] leading-relaxed">{s.notes}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[14px] p-5 border border-[var(--color-border)]" style={{ background: 'var(--color-card)' }}>
          <div className="text-[.66rem] uppercase tracking-widest mb-2 text-[var(--color-sea)]">Track stack</div>
          <ul className="text-[.78rem] text-[var(--color-txt-2)] space-y-1">
            <li>• <span className="text-[var(--color-pusd)] font-bold">Palm USD</span> — primary rail (UAE-issued, Solana-native).</li>
            <li>• <span className="text-[var(--color-coral)] font-bold">Metaplex Core</span> — programmable savings receipt as a Core NFT.</li>
            <li>• <span className="text-[var(--color-sun)] font-bold">Privy</span> — embedded wallet onboarding for non-crypto-native diaspora users.</li>
            <li>• <span className="text-[var(--color-up)] font-bold">Arcium</span> — confidential recipient handles + hidden balances.</li>
            <li>• <span className="text-[var(--color-warn)] font-bold">MoneyGram / MoonPay</span> — fiat on/off-ramp at the corridor edges.</li>
          </ul>
        </section>

        <footer className="text-[.6rem] text-[var(--color-muted)] text-center pt-4">
          A Limer's Capital build · <span className="text-[var(--color-warn)]">devnet preview</span> · not production.
        </footer>
      </main>
    </div>
  );
}
