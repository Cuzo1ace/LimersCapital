import { useState, useEffect } from 'react';
import { getUserCount, getWaitlistCount } from '../api/supabase';

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
    users !== null && users > 0 && { icon: '👥', value: users.toLocaleString(), label: 'Registered Users' },
    waitlist !== null && waitlist > 0 && { icon: '📧', value: waitlist.toLocaleString(), label: 'On Waitlist' },
    { icon: '🏝️', value: '30+', label: 'Caribbean Nations' },
    { icon: '📚', value: '37', label: 'Lessons' },
    { icon: '⛓️', value: 'Solana', label: 'Blockchain' },
  ].filter(Boolean);

  return (
    <div className="flex items-center justify-center gap-6 flex-wrap py-3 px-4 rounded-xl border border-border mb-4"
      style={{ background: 'var(--color-card)' }}>
      {stats.map((s, i) => (
        <div key={i} className="flex items-center gap-2 text-center">
          <span className="text-base">{s.icon}</span>
          <div>
            <div className="font-mono font-bold text-[.88rem] text-txt">{s.value}</div>
            <div className="text-[.58rem] text-muted uppercase tracking-widest">{s.label}</div>
          </div>
          {i < stats.length - 1 && <span className="hidden md:block h-6 w-px bg-border ml-4" />}
        </div>
      ))}
    </div>
  );
}
