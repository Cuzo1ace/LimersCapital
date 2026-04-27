import { ATTRIBUTION_LINE, BLOCKWORKS_HOME } from '../../data/blockworks';

/**
 * AttributionChip — small inline chip rendered alongside price data on the
 * Market / Insights / Trade pages. Acknowledges the data source honestly
 * while framing the feed as Blockworks-curated (matches how
 * blockworks.com/prices itself attributes).
 *
 * Props:
 *   className — optional passthrough
 *   compact   — renders a shorter "Curated by Blockworks" variant when true
 */
export default function AttributionChip({ className = '', compact = false }) {
  const label = compact ? 'Curated by Blockworks ↗' : ATTRIBUTION_LINE;
  return (
    <a
      href={BLOCKWORKS_HOME}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center text-[.56rem] font-mono uppercase tracking-widest text-txt-2 hover:text-coral-lt transition-colors no-underline ${className}`}
      title="Data powered by CoinGecko, editorial curation via Blockworks"
    >
      {label}
    </a>
  );
}
