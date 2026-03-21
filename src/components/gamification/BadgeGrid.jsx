import useStore from '../../store/useStore';
import { BADGES } from '../../data/badges';
import AchievementBadge from './AchievementBadge';

export default function BadgeGrid() {
  const earned = useStore(s => s.earnedBadges);

  return (
    <div>
      <h3 className="font-headline text-[.88rem] font-bold uppercase tracking-widest text-txt mb-3">
        Achievements ({earned.length}/{BADGES.length})
      </h3>
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
        {BADGES.map(b => (
          <AchievementBadge
            key={b.id}
            icon={b.icon}
            title={b.title}
            desc={b.desc}
            cat={b.cat}
            earned={earned.includes(b.id)}
          />
        ))}
      </div>
    </div>
  );
}
