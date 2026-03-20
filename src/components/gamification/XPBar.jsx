import useStore from '../../store/useStore';
import { getTier, getNextTier } from '../../data/gamification';

export default function XPBar() {
  const xp = useStore(s => s.xp);
  const currentStreak = useStore(s => s.currentStreak);
  const tier = getTier(xp);
  const next = getNextTier(xp);
  const progress = next ? ((xp - tier.xp) / (next.xp - tier.xp)) * 100 : 100;

  return (
    <div className="flex items-center gap-2.5">
      {currentStreak > 0 && (
        <span className="text-[.65rem] text-coral" title={`${currentStreak}-day streak`}>
          {'🔥'.repeat(Math.min(currentStreak, 7))}
        </span>
      )}
      <div className="flex items-center gap-2 bg-black/25 border border-border rounded-full px-3 py-1.5 min-w-[160px]">
        <span className="text-sm" title={tier.name}>{tier.icon}</span>
        <div className="flex-1 min-w-[60px]">
          <div className="flex justify-between text-[.58rem] mb-0.5">
            <span style={{ color: tier.color }} className="font-bold">{tier.name}</span>
            <span className="text-muted">{xp} XP</span>
          </div>
          <div className="h-1.5 bg-night-3 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: tier.color }} />
          </div>
        </div>
        {next && <span className="text-[.55rem] text-muted">{next.xp - xp} to {next.icon}</span>}
      </div>
    </div>
  );
}
