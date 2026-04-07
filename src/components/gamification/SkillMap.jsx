import useStore from '../../store/useStore';

/**
 * SkillMap — Hexagonal radar chart showing mastery across 6 trading domains.
 *
 * All scores computed from existing state — no new store fields needed.
 * Each domain: 0-100 score + "Next Step" recommendation.
 */

const DOMAINS = [
  { key: 'fundamentals', label: 'Market Fundamentals', icon: '📊', color: '#00ffa3' },
  { key: 'caribbean', label: 'Caribbean Markets', icon: '🌴', color: '#FFCA3A' },
  { key: 'defi', label: 'Solana / DeFi', icon: '⚡', color: '#bf81ff' },
  { key: 'risk', label: 'Risk Management', icon: '🛡️', color: '#FF5C4D' },
  { key: 'execution', label: 'Trading Execution', icon: '💹', color: '#00d4ff' },
  { key: 'learning', label: 'Learning Progress', icon: '📚', color: '#2D9B56' },
];

function computeScores(state) {
  const {
    lessonsRead = {}, quizResults = {}, trades = [], holdings = [],
    perpPositions = [], perpTradeCount = 0, earnedBadges = [],
    modulesCompleted = [], viewedMicroLessons = [], viewedDailyKnowledge = [],
    teachingMomentsViewed = [], tradeJournal = {},
  } = state;

  const lessonCount = Object.keys(lessonsRead).length;
  const quizCount = Object.keys(quizResults).length;
  const tradeCount = trades.length;
  const ttseTrades = trades.filter(t => t.market === 'ttse').length;
  const solTrades = trades.filter(t => t.market === 'solana').length;
  const perpTrades = perpTradeCount;
  const badgeCount = earnedBadges.length;
  const moduleCount = modulesCompleted.length;
  const microCount = viewedMicroLessons.length;
  const journalCount = Object.keys(tradeJournal).length;

  // Scoring: each domain maxes at 100
  return {
    fundamentals: Math.min(100,
      (lessonCount >= 3 ? 30 : lessonCount * 10) +
      (quizCount >= 1 ? 20 : 0) +
      (teachingMomentsViewed.length >= 5 ? 20 : teachingMomentsViewed.length * 4) +
      (microCount >= 5 ? 15 : microCount * 3) +
      (viewedDailyKnowledge.length >= 10 ? 15 : viewedDailyKnowledge.length * 1.5)
    ),
    caribbean: Math.min(100,
      (ttseTrades >= 5 ? 30 : ttseTrades * 6) +
      (lessonCount >= 6 ? 20 : 0) +
      (quizCount >= 2 ? 20 : 0) +
      (viewedDailyKnowledge.filter(id => id.startsWith('c')).length >= 5 ? 15 : 0) +
      (holdings.some(h => h.market === 'ttse') ? 15 : 0)
    ),
    defi: Math.min(100,
      (solTrades >= 10 ? 25 : solTrades * 2.5) +
      (perpTrades >= 5 ? 25 : perpTrades * 5) +
      (moduleCount >= 3 ? 20 : moduleCount * 7) +
      (microCount >= 10 ? 15 : microCount * 1.5) +
      (earnedBadges.includes('perp_trader') ? 15 : 0)
    ),
    risk: Math.min(100,
      (journalCount >= 10 ? 20 : journalCount * 2) +
      (perpPositions.some(p => p.stopLoss) ? 20 : 0) +
      (holdings.length >= 3 ? 20 : holdings.length * 7) +
      (teachingMomentsViewed.includes('used_stop_loss') ? 15 : 0) +
      (teachingMomentsViewed.includes('high_leverage') ? 10 : 0) +
      (tradeCount >= 20 ? 15 : Math.floor(tradeCount * 0.75))
    ),
    execution: Math.min(100,
      (tradeCount >= 50 ? 30 : Math.floor(tradeCount * 0.6)) +
      (perpTrades >= 10 ? 20 : perpTrades * 2) +
      (journalCount >= 5 ? 20 : journalCount * 4) +
      (badgeCount >= 10 ? 15 : Math.floor(badgeCount * 1.5)) +
      (earnedBadges.includes('ten_trades') ? 15 : 0)
    ),
    learning: Math.min(100,
      (moduleCount >= 4 ? 25 : moduleCount * 6) +
      (lessonCount >= 14 ? 25 : Math.floor(lessonCount * 1.8)) +
      (quizCount >= 4 ? 20 : quizCount * 5) +
      (badgeCount >= 15 ? 15 : badgeCount) +
      (microCount >= 15 ? 15 : microCount)
    ),
  };
}

function getNextStep(key, score) {
  if (score >= 80) return 'Advanced! Keep pushing.';
  const steps = {
    fundamentals: 'Complete more lessons and view trade insights',
    caribbean: 'Try trading TTSE stocks to learn Caribbean markets',
    defi: 'Open a perpetual position on the Perps tab',
    risk: 'Set a stop-loss on your next leveraged trade',
    execution: 'Keep trading and journaling to build experience',
    learning: 'Complete all modules and quizzes',
  };
  return steps[key] || 'Keep learning!';
}

export default function SkillMap({ compact = false }) {
  const state = useStore();
  const scores = computeScores(state);

  // SVG radar chart
  const cx = 120, cy = 120, r = 90;
  const n = DOMAINS.length;
  const angleStep = (2 * Math.PI) / n;

  const getPoint = (i, value) => {
    const angle = angleStep * i - Math.PI / 2;
    const dist = (value / 100) * r;
    return [cx + dist * Math.cos(angle), cy + dist * Math.sin(angle)];
  };

  const gridLevels = [25, 50, 75, 100];
  const dataPoints = DOMAINS.map((d, i) => getPoint(i, scores[d.key]));
  const polygonPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z';

  if (compact) {
    // Compact version: small hexagon + overall score
    const avg = Math.round(DOMAINS.reduce((sum, d) => sum + scores[d.key], 0) / n);
    return (
      <div className="flex items-center gap-3">
        <svg width="60" height="60" viewBox="0 0 240 240" className="flex-shrink-0">
          <path d={polygonPath} fill="rgba(0,255,163,.15)" stroke="#00ffa3" strokeWidth="2" />
          {DOMAINS.map((d, i) => {
            const [x, y] = getPoint(i, 100);
            return <line key={d.key} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,.08)" strokeWidth="1" />;
          })}
        </svg>
        <div>
          <div className="text-[.6rem] text-muted uppercase tracking-wider">Skill Score</div>
          <div className="font-headline text-[1.2rem] font-black text-[#00ffa3]">{avg}/100</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border p-5" style={{ background: 'var(--color-card)' }}>
      <div className="text-[.66rem] text-muted uppercase tracking-widest mb-4 font-headline">
        🗺️ Skill Map
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Radar SVG */}
        <svg width="240" height="240" viewBox="0 0 240 240" className="flex-shrink-0">
          {/* Grid */}
          {gridLevels.map(level => {
            const pts = DOMAINS.map((_, i) => getPoint(i, level));
            const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z';
            return <path key={level} d={path} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="1" />;
          })}

          {/* Axis lines */}
          {DOMAINS.map((d, i) => {
            const [x, y] = getPoint(i, 100);
            return <line key={d.key} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,.08)" strokeWidth="1" />;
          })}

          {/* Data polygon */}
          <path d={polygonPath} fill="rgba(0,255,163,.12)" stroke="#00ffa3" strokeWidth="2" />

          {/* Data points */}
          {dataPoints.map((p, i) => (
            <circle key={DOMAINS[i].key} cx={p[0]} cy={p[1]} r="4" fill={DOMAINS[i].color} />
          ))}

          {/* Labels */}
          {DOMAINS.map((d, i) => {
            const [x, y] = getPoint(i, 115);
            return (
              <text
                key={d.key}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[9px] fill-current text-muted"
              >
                {d.icon}
              </text>
            );
          })}
        </svg>

        {/* Domain breakdown */}
        <div className="flex-1 flex flex-col gap-2 w-full">
          {DOMAINS.map(d => (
            <div key={d.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[.68rem] text-txt flex items-center gap-1.5">
                  <span>{d.icon}</span>
                  <span>{d.label}</span>
                </span>
                <span className="text-[.68rem] font-mono font-bold" style={{ color: d.color }}>
                  {Math.round(scores[d.key])}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${scores[d.key]}%`, background: d.color }}
                />
              </div>
              <div className="text-[.56rem] text-muted mt-0.5">
                {getNextStep(d.key, scores[d.key])}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
