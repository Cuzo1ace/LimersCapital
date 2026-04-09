import { motion } from 'framer-motion';

function MiniSparkline({ data = [], color = '#00ffa3', width = 48, height = 20 }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-shrink-0">
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </svg>
  );
}

function ChangeBadge({ value }) {
  const isPositive = value > 0;
  const isZero = value === 0;
  const color = isZero ? 'text-muted' : isPositive ? 'text-up' : 'text-down';
  const bg = isZero
    ? 'bg-muted/10'
    : isPositive
      ? 'bg-up/10'
      : 'bg-down/10';

  return (
    <motion.span
      key={Math.round(value * 10)}
      initial={{ scale: 1.15 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[.65rem] font-mono font-semibold ${color} ${bg}`}
    >
      {isPositive ? '+' : ''}{value.toFixed(1)}%
    </motion.span>
  );
}

const fadeInUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export default function TokenPriceRow({ token, index = 0, onClick }) {
  const {
    symbol = '???',
    name = '',
    price = 0,
    change24h = 0,
    sparkline = [],
    color = '#00ffa3',
    image,
  } = token;

  const sparkColor = change24h >= 0 ? '#00ffa3' : '#ff716c';

  return (
    <motion.div
      variants={fadeInUp}
      onClick={onClick}
      className="flex items-center gap-3 px-4 h-14 rounded-xl cursor-pointer
        backdrop-blur-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]
        hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.15)]
        hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all duration-300 press-scale"
    >
      {/* Token icon */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: `rgba(${hexToRgb(color)},0.15)`,
          boxShadow: `0 0 12px rgba(${hexToRgb(color)},0.2)`,
        }}
      >
        {image ? (
          <img src={image} alt={symbol} className="w-5 h-5 rounded-full" />
        ) : (
          <span className="text-[.7rem] font-bold" style={{ color }}>{symbol.slice(0, 2)}</span>
        )}
      </div>

      {/* Name + Symbol */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[.82rem] font-body font-medium text-txt truncate">{name}</span>
        <span className="text-[.6rem] text-muted font-mono">{symbol}</span>
      </div>

      {/* Sparkline */}
      <MiniSparkline data={sparkline} color={sparkColor} />

      {/* Price + Change */}
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <span className="text-[.82rem] font-mono font-semibold text-txt">
          ${typeof price === 'number' ? (price < 1 ? price.toPrecision(3) : price.toLocaleString(undefined, { maximumFractionDigits: 2 })) : price}
        </span>
        <ChangeBadge value={change24h} />
      </div>
    </motion.div>
  );
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ].join(',');
}
