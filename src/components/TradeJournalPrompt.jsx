import { useState } from 'react';
import useStore from '../store/useStore';

const STRATEGIES = ['Technical', 'Fundamental', 'Momentum', 'Hedging', 'Learning', 'DCA'];
const EMOTIONS = ['Confident', 'Uncertain', 'FOMO', 'Calculated', 'Cautious'];

/**
 * TradeJournalPrompt — Small drawer after trade execution.
 *
 * Prompts users to reflect on WHY they traded — strategy, emotion, reasoning.
 * Never forces journaling — always has a skip option.
 * Awards XP for entries (10 for first, 5 after).
 */
export default function TradeJournalPrompt() {
  const lastTrade = useStore(s => s.trades[0]);
  const journalPromptEnabled = useStore(s => s.journalPromptEnabled);
  const addJournalEntry = useStore(s => s.addJournalEntry);
  const tradeJournal = useStore(s => s.tradeJournal);
  const [visible, setVisible] = useState(true);
  const [strategy, setStrategy] = useState('');
  const [emotion, setEmotion] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!lastTrade || !journalPromptEnabled || !visible || submitted) return null;

  // Don't show if this trade already has a journal entry
  if (tradeJournal[lastTrade.id]) return null;

  const handleSubmit = () => {
    if (!strategy && !emotion && !reason) return;
    addJournalEntry(lastTrade.id, { strategy, emotion, reason });
    setSubmitted(true);
  };

  return (
    <div
      className="rounded-xl border p-4 mt-3 animate-[slideUp_0.3s_ease]"
      style={{
        background: 'linear-gradient(135deg, rgba(13,17,23,.95), rgba(22,30,41,.95))',
        border: '1px solid rgba(0,255,163,.15)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">📝</span>
          <span className="text-[.66rem] font-mono font-bold text-[#00ffa3] uppercase tracking-wider">
            Trade Journal
          </span>
          <span className="text-[.55rem] text-muted">
            +{Object.keys(tradeJournal).length === 0 ? '10' : '5'} XP
          </span>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-[.6rem] text-muted hover:text-txt cursor-pointer bg-transparent border-none"
        >
          Skip
        </button>
      </div>

      <div className="text-[.72rem] text-txt-2 mb-3">
        Why did you make this trade? Quick reflection builds better habits.
      </div>

      {/* Strategy */}
      <div className="mb-2.5">
        <div className="text-[.58rem] text-muted uppercase tracking-wider mb-1">Strategy</div>
        <div className="flex flex-wrap gap-1.5">
          {STRATEGIES.map(s => (
            <button
              key={s}
              onClick={() => setStrategy(strategy === s ? '' : s)}
              className={`text-[.62rem] font-mono px-2.5 py-1 rounded-lg border cursor-pointer transition-all
                ${strategy === s
                  ? 'border-[#00ffa3]/40 bg-[#00ffa3]/10 text-[#00ffa3]'
                  : 'border-border bg-transparent text-muted hover:text-txt hover:border-txt/30'
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Emotion */}
      <div className="mb-2.5">
        <div className="text-[.58rem] text-muted uppercase tracking-wider mb-1">Mindset</div>
        <div className="flex flex-wrap gap-1.5">
          {EMOTIONS.map(e => (
            <button
              key={e}
              onClick={() => setEmotion(emotion === e ? '' : e)}
              className={`text-[.62rem] font-mono px-2.5 py-1 rounded-lg border cursor-pointer transition-all
                ${emotion === e
                  ? 'border-[#FFCA3A]/40 bg-[#FFCA3A]/10 text-[#FFCA3A]'
                  : 'border-border bg-transparent text-muted hover:text-txt hover:border-txt/30'
                }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Reason */}
      <div className="mb-3">
        <div className="text-[.58rem] text-muted uppercase tracking-wider mb-1">Notes (optional)</div>
        <input
          type="text"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="What made you take this trade?"
          maxLength={200}
          className="w-full bg-black/30 border border-border text-txt rounded-lg px-3 py-1.5 font-body text-[.72rem] outline-none focus:border-[#00ffa3]/40 placeholder:text-muted/50"
        />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={!strategy && !emotion && !reason}
          className="text-[.68rem] font-bold px-4 py-1.5 rounded-lg bg-[#00ffa3]/10 text-[#00ffa3] border border-[#00ffa3]/25 hover:bg-[#00ffa3]/20 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Save Entry
        </button>
        <button
          onClick={() => setVisible(false)}
          className="text-[.68rem] px-3 py-1.5 rounded-lg text-muted hover:text-txt border border-border hover:border-txt/30 transition-all cursor-pointer"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
