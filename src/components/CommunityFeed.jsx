import { useState, useEffect } from 'react';
import { fetchActivityFeed, subscribeActivityFeed } from '../api/supabase';
import { isSupabaseReady } from '../lib/supabase';

/**
 * Community activity feed — shows REAL user events from Supabase.
 * Falls back to simulated activity when Supabase is unavailable or empty.
 */

const CARIBBEAN_COUNTRIES = [
  'Trinidad', 'Jamaica', 'Barbados', 'Bahamas', 'Guyana',
  'St. Lucia', 'Grenada', 'Antigua', 'Dominica', 'St. Kitts',
  'Belize', 'Suriname', 'St. Vincent', 'Cayman Islands', 'Bermuda',
];

const ACTIVITY_TEMPLATES = [
  { icon: '📚', template: (c) => `A user in ${c} just completed Blockchain Basics` },
  { icon: '💹', template: (c) => `Someone in ${c} made their first paper trade` },
  { icon: '🎖️', template: (c) => `A trader in ${c} earned the Diamond Hands badge` },
  { icon: '🔥', template: (c) => `A user in ${c} hit a 7-day streak` },
  { icon: '📈', template: (c) => `Someone in ${c} is exploring Solana DeFi protocols` },
  { icon: '🗺️', template: (c) => `A user in ${c} checked their local crypto regulations` },
  { icon: '🎓', template: (c) => `Someone in ${c} completed all Foundations lessons` },
  { icon: '💎', template: (c) => `A user in ${c} reached Reef Spotter tier` },
  { icon: '🔗', template: (c) => `Someone in ${c} connected their Solflare wallet` },
  { icon: '📊', template: (c) => `A trader in ${c} is analyzing TTSE market data` },
];

function generateActivity() {
  const template = ACTIVITY_TEMPLATES[Math.floor(Math.random() * ACTIVITY_TEMPLATES.length)];
  const country = CARIBBEAN_COUNTRIES[Math.floor(Math.random() * CARIBBEAN_COUNTRIES.length)];
  const minutesAgo = Math.floor(Math.random() * 45) + 1;
  return {
    id: Date.now() + Math.random(),
    icon: template.icon,
    text: template.template(country),
    time: minutesAgo <= 1 ? 'just now' : `${minutesAgo}m ago`,
  };
}

function formatTime(createdAt) {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function CommunityFeed({ limit = 5 }) {
  const [activities, setActivities] = useState([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let unsub = () => {};

    async function init() {
      if (!isSupabaseReady()) {
        setActivities(Array.from({ length: limit }, generateActivity));
        return;
      }

      const realData = await fetchActivityFeed(limit);
      if (realData.length > 0) {
        setActivities(realData.map(a => ({
          id: a.id,
          icon: a.icon,
          text: a.description,
          time: formatTime(a.created_at),
        })));
        setIsLive(true);

        unsub = subscribeActivityFeed((newEvent) => {
          setActivities(prev => [
            {
              id: newEvent.id,
              icon: newEvent.icon,
              text: newEvent.description,
              time: 'just now',
            },
            ...prev.slice(0, limit - 1),
          ]);
        });
      } else {
        setActivities(Array.from({ length: limit }, generateActivity));
      }
    }

    init();
    return () => unsub();
  }, [limit]);

  // Simulated mode: add activity every 30-60s
  useEffect(() => {
    if (isLive) return;
    const interval = setInterval(() => {
      setActivities(prev => [generateActivity(), ...prev.slice(0, limit - 1)]);
    }, 30000 + Math.random() * 30000);
    return () => clearInterval(interval);
  }, [limit, isLive]);

  return (
    <div className="rounded-xl border border-border p-5" style={{ background: 'var(--color-card)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[.66rem] text-muted uppercase tracking-widest font-headline">
          🌴 Caribbean Community
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-up' : 'bg-sun'} animate-pulse`} />
          <span className={`text-[.6rem] ${isLive ? 'text-up' : 'text-sun'}`}>
            {isLive ? 'Live' : 'Simulated'}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        {activities.map(a => (
          <div key={a.id}
            className="flex items-center gap-2.5 py-2 border-b border-white/5 last:border-0
              animate-in fade-in slide-in-from-top-1 duration-300">
            <span className="text-base flex-shrink-0">{a.icon}</span>
            <span className="text-[.74rem] text-txt-2 flex-1">{a.text}</span>
            <span className="text-[.6rem] text-muted flex-shrink-0">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
