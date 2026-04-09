import { useState } from 'react';
import { submitFeedback } from '../api/supabase';
import useStore from '../store/useStore';

/**
 * Floating feedback button + modal.
 * Collects bug reports, feature requests, and general feedback.
 * Persists to Supabase `feedback` table.
 */
export default function FeedbackWidget() {
  const { walletAddress } = useStore();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus('loading');

    const result = await submitFeedback({
      walletAddress,
      email: email || null,
      category,
      message: message.trim(),
      page: window.location.pathname,
    });

    if (result.success) {
      setStatus('success');
      setTimeout(() => {
        setOpen(false);
        setStatus('idle');
        setMessage('');
        setCategory('general');
      }, 2000);
    } else {
      setStatus('error');
    }
  }

  const CATEGORIES = [
    { value: 'general', label: 'General Feedback', icon: '💬' },
    { value: 'bug', label: 'Bug Report', icon: '🐛' },
    { value: 'feature', label: 'Feature Request', icon: '💡' },
    { value: 'ux', label: 'UX / Design', icon: '🎨' },
  ];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-sea text-night border-none cursor-pointer shadow-lg
          flex items-center justify-center text-xl hover:scale-110 transition-transform"
        title="Send Feedback">
        💬
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-2xl border border-border p-6 animate-in fade-in slide-in-from-bottom-4 duration-200"
            style={{ background: 'var(--color-card)' }}
            onClick={e => e.stopPropagation()}>

            <button onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-txt text-lg bg-transparent border-none cursor-pointer">
              &times;
            </button>

            {status === 'success' ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">🙏</div>
                <h3 className="font-body font-bold text-[1rem] text-up">Thank you!</h3>
                <p className="text-[.78rem] text-txt-2 mt-1">Your feedback helps us build better for the Caribbean.</p>
              </div>
            ) : (
              <>
                <h3 className="font-headline text-[1rem] font-bold text-txt mb-4">Send Feedback</h3>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  {/* Category chips */}
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => (
                      <button key={c.value} type="button"
                        onClick={() => setCategory(c.value)}
                        className={`px-3 py-1.5 rounded-full text-[.74rem] font-body cursor-pointer border transition-all
                          ${category === c.value
                            ? 'bg-sea/15 border-sea/40 text-sea'
                            : 'bg-transparent border-border text-muted hover:border-txt/30'}`}>
                        {c.icon} {c.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={category === 'bug' ? 'Describe the bug and steps to reproduce...' : 'Your thoughts...'}
                    rows={4}
                    required
                    className="w-full bg-black/30 border border-border text-txt rounded-xl px-4 py-3 font-mono text-[.82rem] outline-none focus:border-sea transition-colors resize-none"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email (optional, for follow-up)"
                    className="w-full bg-black/30 border border-border text-txt rounded-xl px-4 py-2.5 font-mono text-[.78rem] outline-none focus:border-sea transition-colors"
                  />

                  <button type="submit" disabled={status === 'loading' || !message.trim()}
                    className="w-full px-4 py-3 rounded-xl font-body font-bold text-[.86rem] cursor-pointer border-none bg-sea text-night hover:brightness-90 transition-all disabled:opacity-50">
                    {status === 'loading' ? 'Sending...' : 'Submit Feedback'}
                  </button>

                  {status === 'error' && (
                    <p className="text-[.74rem] text-[#FF6B6B] text-center">Failed to send. Try again later.</p>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
