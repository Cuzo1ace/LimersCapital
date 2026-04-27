import {
  StarIcon,
  TargetIcon,
  SignalIcon,
  ShieldIcon,
  TrophyIcon,
  ExchangeIcon,
  ConnectionIcon,
  LimerIcon,
} from '../icons';
import LimerMark from '../brand/LimerMark';

/**
 * Maps a gamification tier level (1–10) to a branded icon.
 * Keeps data/gamification.js untouched so pages across the app can opt in
 * without rippling a change into Learn / Points / Community surfaces.
 */
const TIER_ICON = {
  1: StarIcon,
  2: TargetIcon,
  3: LimerMark,
  4: SignalIcon,
  5: ShieldIcon,
  6: TrophyIcon,
  7: StarIcon,
  8: ExchangeIcon,
  9: ConnectionIcon,
  10: LimerIcon,
};

export default function TierMark({ tier, size = 12, className }) {
  if (!tier) return null;
  const Cmp = TIER_ICON[tier.level] || StarIcon;
  const filled = tier.level >= 7;
  return <Cmp size={size} filled={filled} title={tier.name} className={className} />;
}
