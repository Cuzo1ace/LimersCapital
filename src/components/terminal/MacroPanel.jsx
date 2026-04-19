import ReactApexChart from 'react-apexcharts';
import GlassCard from '../ui/GlassCard';
import { mockMacro, mockCaribbeanFx } from '../../api/marketDataMock';

function Sparkline({ data, color }) {
  const options = {
    chart: { type: 'line', sparkline: { enabled: true }, animations: { enabled: false }, toolbar: { show: false } },
    stroke: { width: 2, curve: 'smooth', colors: [color] },
    tooltip: { enabled: false },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0 } },
  };
  return (
    <ReactApexChart
      options={options}
      series={[{ data }]}
      type="line"
      height={36}
    />
  );
}

function direction(series) {
  if (!series || series.length < 2) return 0;
  return series[series.length - 1] - series[0];
}

export default function MacroPanel() {
  const macro = mockMacro();
  const fx    = mockCaribbeanFx();

  const usCards = [
    { id: 'FEDFUNDS', hint: 'Policy rate',       color: '#00ffa3' },
    { id: 'CPI',      hint: 'Inflation YoY',     color: '#bf81ff' },
    { id: 'US10Y',    hint: 'Real yield proxy',  color: '#FFCA3A' },
    { id: 'DXY',      hint: 'Dollar index',      color: '#00c8ff' },
    { id: 'BTC_DOM',  hint: 'Crypto risk gauge', color: '#F7931A' },
    { id: 'VIX',      hint: 'Equity vol',        color: '#ff716c' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Caribbean FX — listed FIRST to anchor the regional lens. */}
      <div>
        <div className="text-[.6rem] uppercase tracking-[.3em] text-gold font-mono mb-2">
          Caribbean FX · rates vs USD
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(fx).map(([id, f]) => {
            const delta = direction(f.series);
            const isPegged = f.peg === 'hard';
            const color = isPegged ? '#7d7e82' : (delta > 0 ? '#ff716c' : delta < 0 ? '#00ffa3' : '#7d7e82');
            return (
              <GlassCard key={id} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[.55rem] uppercase tracking-[.25em] text-muted font-mono">
                    {f.label}
                  </div>
                  {f.peg && (
                    <div className={`text-[.5rem] font-mono px-1.5 py-0.5 rounded ${f.peg === 'hard' ? 'bg-gold/10 text-gold' : 'bg-sea/10 text-sea'}`}>
                      {f.peg === 'hard' ? 'pegged' : 'managed'}
                    </div>
                  )}
                </div>
                <div className="font-headline text-xl font-black text-txt">
                  {f.value.toFixed(f.value >= 100 ? 1 : 2)}
                </div>
                <div className="text-[.6rem] text-txt-2 mt-0.5 font-mono">{f.country}</div>
                <div className="mt-2"><Sparkline data={f.series} color={color} /></div>
                <div className="text-[.58rem] font-mono mt-1" style={{ color }}>
                  {isPegged ? 'flat · band' : (delta > 0 ? '▲' : delta < 0 ? '▼' : '—')} 12-mo
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Global / US macro — second lens */}
      <div>
        <div className="text-[.6rem] uppercase tracking-[.3em] text-muted font-mono mb-2">
          Global &amp; US macro
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {usCards.map(c => {
            const m = macro[c.id];
            if (!m) return null;
            const delta = direction(m.series);
            const deltaColor = delta > 0 ? '#00ffa3' : delta < 0 ? '#ff716c' : '#7d7e82';
            return (
              <GlassCard key={c.id} className="p-4">
                <div className="text-[.55rem] uppercase tracking-[.25em] text-muted font-mono mb-1">
                  {m.label}
                </div>
                <div className="font-headline text-xl font-black text-txt">
                  {m.value.toFixed(m.unit === '%' ? 2 : 1)}{m.unit}
                </div>
                <div className="text-[.6rem] text-txt-2 mt-0.5 font-mono">{c.hint}</div>
                <div className="mt-2"><Sparkline data={m.series} color={deltaColor} /></div>
                <div className="text-[.58rem] font-mono mt-1" style={{ color: deltaColor }}>
                  {delta > 0 ? '▲' : delta < 0 ? '▼' : '—'} 12-mo
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      <GlassCard className="p-5">
        <div className="text-[.65rem] uppercase tracking-[.3em] text-muted font-mono mb-3">
          Macro cross-asset context
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="text-txt-2 mb-1">Rates regime</div>
            <div className="text-txt font-mono">
              Fed funds {macro.FEDFUNDS.value}% vs 10Y {macro.US10Y.value}% —{' '}
              <span className={macro.FEDFUNDS.value > macro.US10Y.value ? 'text-down' : 'text-sea'}>
                {macro.FEDFUNDS.value > macro.US10Y.value ? 'curve inverted' : 'curve normal'}
              </span>
            </div>
          </div>
          <div>
            <div className="text-txt-2 mb-1">Risk appetite</div>
            <div className="text-txt font-mono">
              VIX {macro.VIX.value} ·{' '}
              <span className={macro.VIX.value > 20 ? 'text-down' : 'text-sea'}>
                {macro.VIX.value > 20 ? 'elevated' : 'complacent'}
              </span>
            </div>
          </div>
          <div>
            <div className="text-txt-2 mb-1">Crypto posture</div>
            <div className="text-txt font-mono">
              BTC dom {macro.BTC_DOM.value}% — {macro.BTC_DOM.value > 55 ? 'alt-unfavorable' : 'alt-rotation'}
            </div>
          </div>
        </div>
        <div className="text-[.6rem] text-muted mt-3 italic font-mono">
          Mock snapshot — wire Alpha Vantage ECON + Artemis as soon as ALPHAVANTAGE_API_KEY is provisioned.
        </div>
      </GlassCard>
    </div>
  );
}
