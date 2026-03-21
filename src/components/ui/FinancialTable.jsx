import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * FinancialTable — animated data table with sparklines, performance pills,
 * and staggered row reveal. Veridian Night themed.
 *
 * Props:
 *   title     — header label (e.g. "Token", "Index")
 *   columns   — array of { key, label, align?, render?, hide? }
 *   rows      — array of data objects
 *   onRowClick — (row) => void
 *   className — extra classes
 *   getRowId  — (row) => string, default row.id
 */

/* ── Formatting helpers ── */
export function fmtCurrency(n, decimals = 2) {
  if (n == null) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(decimals)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(decimals)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(decimals)}K`;
  return `$${n.toFixed(decimals)}`;
}

export function fmtPct(v) {
  if (v == null) return '—';
  const sign = v >= 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

/* ── Performance pill ── */
export function PerfPill({ value }) {
  if (value == null) return <span className="text-muted text-xs">—</span>;
  const positive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[.72rem] font-mono font-semibold border
      ${positive
        ? 'text-up bg-up/10 border-up/25'
        : 'text-down bg-down/10 border-down/25'
      }`}>
      {positive ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

/* ── Sparkline ── */
export function Sparkline({ data, width = 64, height = 24, color }) {
  const shouldReduceMotion = useReducedMotion();

  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="bg-white/5 rounded" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 4) + 2;
    const y = height - 2 - ((v - min) / range) * (height - 4);
    return `${x},${y}`;
  }).join(' ');

  const lineColor = color || (data[data.length - 1] >= data[0] ? '#00ffa3' : '#ff716c');

  return (
    <motion.svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25, duration: shouldReduceMotion ? 0.15 : 0.4 }}
    >
      <motion.polyline
        points={points}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: shouldReduceMotion ? 0.2 : 0.7, ease: 'easeOut', delay: 0.15 }}
      />
    </motion.svg>
  );
}

/* ── Main table ── */
export default function FinancialTable({
  title = 'Asset',
  columns,
  rows = [],
  onRowClick,
  className = '',
  getRowId = (r) => r.id,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const shouldReduceMotion = useReducedMotion();

  const handleClick = (row) => {
    const id = getRowId(row);
    setSelectedId(id);
    onRowClick?.(row);
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.04,
        delayChildren: 0.08,
      },
    },
  };

  const rowVariants = {
    hidden: {
      opacity: 0,
      y: 16,
      scale: 0.98,
      filter: shouldReduceMotion ? 'none' : 'blur(3px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
        mass: 0.7,
      },
    },
  };

  /* Build grid template from columns */
  const gridCols = columns.map(c => c.width || '1fr').join(' ');

  return (
    <div className={`w-full ${className}`}>
      <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--color-card)' }}>
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header */}
            <div
              className="px-4 md:px-6 py-2.5 text-[.62rem] font-headline text-muted uppercase tracking-[.15em] border-b border-border"
              style={{
                display: 'grid',
                gridTemplateColumns: gridCols,
                gap: '8px',
                background: 'rgba(255,255,255,.02)',
              }}
            >
              {columns.map(col => (
                <div
                  key={col.key}
                  style={{ textAlign: col.align || 'left' }}
                  className={col.hideOnMobile ? 'hidden md:block' : ''}
                >
                  {col.label}
                </div>
              ))}
            </div>

            {/* Rows */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible">
              {rows.map((row, i) => {
                const id = getRowId(row);
                const isSelected = selectedId === id;
                return (
                  <motion.div key={id} variants={rowVariants}>
                    <div
                      className={`px-4 md:px-6 py-3 cursor-pointer group relative transition-all duration-200 border-b border-border/30 last:border-0
                        ${isSelected ? 'bg-sea/5' : 'hover:bg-white/[.02]'}
                      `}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: gridCols,
                        gap: '8px',
                      }}
                      onClick={() => handleClick(row)}
                    >
                      {columns.map(col => (
                        <div
                          key={col.key}
                          className={`flex items-center ${col.hideOnMobile ? 'hidden md:flex' : ''}`}
                          style={{ justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start' }}
                        >
                          {col.render
                            ? col.render(row, i)
                            : <span className="text-[.82rem] text-txt font-body">{row[col.key] ?? '—'}</span>
                          }
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
