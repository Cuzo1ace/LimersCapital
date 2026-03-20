import useStore from '../../store/useStore';
import { BADGES } from '../../data/badges';

export default function BadgeGrid() {
  const earned = useStore(s => s.earnedBadges);

  return (
    <div>
      <h3 className="font-sans text-[.88rem] font-bold uppercase tracking-widest text-txt mb-3">
        Achievements ({earned.length}/{BADGES.length})
      </h3>
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
        {BADGES.map(b => {
          const isEarned = earned.includes(b.id);
          return (
            <div key={b.id}
              className={`rounded-xl p-3 border text-center transition-all ${isEarned
                ? 'border-sun/30 bg-sun/5'
                : 'border-border bg-black/20 opacity-40'}`}
              title={isEarned ? `${b.title}: ${b.desc}` : `??? — ${b.desc}`}>
              <div className="text-2xl mb-1">{isEarned ? b.icon : '❓'}</div>
              <div className="text-[.62rem] font-bold text-txt truncate">{isEarned ? b.title : '???'}</div>
              <div className="text-[.55rem] text-muted mt-0.5">{b.cat}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
