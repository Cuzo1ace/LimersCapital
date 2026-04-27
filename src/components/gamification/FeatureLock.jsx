import useStore from '../../store/useStore';
import { LockIcon } from '../icons';

export default function FeatureLock({ featureKey, hint, children }) {
  const unlocked = useStore(s => s.unlockedFeatures.includes(featureKey));

  if (unlocked) return children;

  return (
    <div className="relative">
      <div className="blur-[3px] pointer-events-none select-none opacity-50" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
        <div className="w-12 h-12 rounded-full bg-night-2 border border-border flex items-center justify-center">
          <LockIcon size={20} className="text-muted" />
        </div>
        <div className="text-[.78rem] text-txt font-body font-bold text-center">Locked</div>
        <div className="text-[.68rem] text-muted text-center max-w-[240px] leading-relaxed">{hint}</div>
      </div>
    </div>
  );
}
