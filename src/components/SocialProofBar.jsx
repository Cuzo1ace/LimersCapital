import { useState, useEffect } from 'react';
import { getUserCount, getWaitlistCount } from '../api/supabase';
import {
  ConnectionIcon,
  ExchangeIcon,
  LearnIcon,
  LinkIcon,
} from './icons';
import LimerMark from './brand/LimerMark';

/**
 * Social proof stats bar — shows real platform metrics.
 * Place on Dashboard, Landing, or About pages.
 */
export default function SocialProofBar() {
  const [users, setUsers] = useState(null);
  const [waitlist, setWaitlist] = useState(null);

  useEffect(() => {
    getUserCount().then(setUsers);
    getWaitlistCount().then(setWaitlist);
  }, []);

  const stats = [
    users !== null && users > 0 && { Icon: ConnectionIcon, iconClass: 'text-sea', value: users.toLocaleString(), label: 'Registered Users' },
    waitlist !== null && waitlist > 0 && { Icon: LinkIcon, iconClass: 'text-coral', value: waitlist.toLocaleString(), label: 'On Waitlist' },
    { Icon: LimerMark, iconClass: '', value: '30+', label: 'Caribbean Nations' },
    { Icon: LearnIcon, iconClass: 'text-sun', value: '37', label: 'Lessons' },
    { Icon: ExchangeIcon, iconClass: 'text-sea', value: 'Solana', label: 'Blockchain' },
  ].filter(Boolean);

  return (
    <div
      className="flex items-center justify-center gap-6 flex-wrap py-3 px-4 rounded-xl border border-border mb-4"
      style={{ background: 'var(--color-card)' }}
    >
      {stats.map((s, i) => (
        <div key={i} className="flex items-center gap-2 text-center">
          <s.Icon size={16} className={s.iconClass} />
          <div>
            <div className="font-mono font-bold text-[.88rem] text-txt">{s.value}</div>
            <div className="text-[.58rem] text-muted uppercase tracking-widest">{s.label}</div>
          </div>
          {i < stats.length - 1 && <span className="hidden md:block h-6 w-px bg-border ml-4" aria-hidden="true" />}
        </div>
      ))}
    </div>
  );
}
