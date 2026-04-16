const CHIPS = [
  { id: 'all',        label: 'All',       icon: '🌐' },
  { id: 'solana',     label: 'Solana',    icon: '⚡' },
  { id: 'ttse',       label: 'TTSE',      icon: '🏛️' },
  { id: 'caribbean',  label: 'Caribbean', icon: '🌴' },
  { id: 'events',     label: 'Events',    icon: '📅' },
  { id: 'learn',      label: 'Learn',     icon: '📚' },
];

export default function FilterChips({ value, onChange }) {
  return (
    <div
      className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-3 px-3 md:mx-0 md:px-0 sticky top-14 md:top-16 z-30 py-2 bg-[rgba(13,14,16,.85)] backdrop-blur-md"
      role="tablist"
      aria-label="News filter"
    >
      {CHIPS.map(chip => {
        const active = value === chip.id;
        return (
          <button
            key={chip.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(chip.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[.7rem] font-headline uppercase tracking-widest border transition-all cursor-pointer
              ${active
                ? 'bg-sea/15 border-sea/40 text-sea'
                : 'bg-transparent border-border text-muted hover:text-txt hover:border-white/20'
              }`}
          >
            <span className="mr-1">{chip.icon}</span>{chip.label}
          </button>
        );
      })}
    </div>
  );
}
