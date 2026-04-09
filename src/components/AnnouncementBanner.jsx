import { useState, useEffect } from 'react';
import { fetchAnnouncements, subscribeAnnouncements } from '../api/supabase';

/**
 * Platform-wide announcement banner.
 * Pulls active announcements from Supabase and displays the highest-priority one.
 * Supports real-time updates — add a row in Supabase Dashboard and it appears instantly.
 */

const TYPE_STYLES = {
  info:    { bg: 'rgba(0,200,180,.08)', border: 'rgba(0,200,180,.25)', text: '#00C8B4' },
  warning: { bg: 'rgba(255,202,58,.08)', border: 'rgba(255,202,58,.25)', text: '#FFCA3A' },
  success: { bg: 'rgba(0,255,163,.08)',  border: 'rgba(0,255,163,.25)',  text: '#00ffa3' },
  update:  { bg: 'rgba(153,69,255,.08)', border: 'rgba(153,69,255,.25)', text: '#9945FF' },
};

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dismissed-announcements') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    fetchAnnouncements().then(setAnnouncements);
    const unsub = subscribeAnnouncements(setAnnouncements);
    return unsub;
  }, []);

  function dismiss(id) {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem('dismissed-announcements', JSON.stringify(next));
  }

  const visible = announcements.filter(a => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  const a = visible[0]; // show highest priority
  const style = TYPE_STYLES[a.type] || TYPE_STYLES.info;

  return (
    <div className="rounded-xl border px-5 py-3.5 mb-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
      style={{ background: style.bg, borderColor: style.border }}>
      <span className="text-lg flex-shrink-0 mt-0.5">{a.icon || '📢'}</span>
      <div className="flex-1 min-w-0">
        <div className="font-body font-bold text-[.84rem] mb-0.5" style={{ color: style.text }}>
          {a.title}
        </div>
        <div className="text-[.76rem] text-txt-2 leading-relaxed">
          {a.message}
          {a.link_url && (
            <a href={a.link_url} target="_blank" rel="noopener noreferrer"
              className="ml-2 underline" style={{ color: style.text }}>
              {a.link_label || 'Learn more'}
            </a>
          )}
        </div>
      </div>
      <button onClick={() => dismiss(a.id)}
        className="flex-shrink-0 bg-transparent border-none cursor-pointer text-muted hover:text-txt text-sm mt-0.5">
        &times;
      </button>
    </div>
  );
}
