import { useState } from 'react';
import { joinWaitlist, getWaitlistCount } from '../api/supabase';
import useStore from '../store/useStore';

/**
 * Waitlist email capture modal with social proof counter.
 * Shows on dashboard for users who haven't joined yet.
 */
export default function WaitlistModal({ onClose }) {
  const { walletAddress } = useStore();
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [waitlistCount, setWaitlistCount] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useState(() => {
    getWaitlistCount().then(c => setWaitlistCount(c));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');

    const result = await joinWaitlist({
      email,
      country: country || null,
      source: 'app',
      walletAddress,
    });

    if (result.success) {
      setStatus('success');
      setWaitlistCount(prev => (prev || 0) + 1);
    } else {
      setStatus('error');
      setErrorMsg(result.error || 'Something went wrong');
    }
  }

  const CARIBBEAN_COUNTRIES = [
    '', 'Trinidad & Tobago', 'Jamaica', 'Barbados', 'Bahamas', 'Guyana',
    'St. Lucia', 'Grenada', 'Antigua & Barbuda', 'Dominica', 'St. Kitts & Nevis',
    'Belize', 'Suriname', 'St. Vincent', 'Cayman Islands', 'Bermuda',
    'Haiti', 'Dominican Republic', 'Puerto Rico', 'Cuba', 'Other',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl border border-border p-7 animate-in fade-in zoom-in-95 duration-200"
        style={{ background: 'var(--color-card)' }}
        onClick={e => e.stopPropagation()}>

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-txt text-lg bg-transparent border-none cursor-pointer">
          &times;
        </button>

        {status === 'success' ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">🍋</div>
            <h3 className="font-headline text-xl font-bold text-txt mb-2">You're on the list!</h3>
            <p className="text-[.82rem] text-txt-2 mb-4">
              We'll notify you when $LIMER launches and early access opens.
            </p>
            {waitlistCount > 0 && (
              <div className="inline-flex items-center gap-2 bg-sea/10 border border-sea/20 rounded-full px-4 py-2 text-[.78rem] text-sea">
                <span className="w-2 h-2 rounded-full bg-sea animate-pulse" />
                {waitlistCount.toLocaleString()} people on the waitlist
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">🌴</div>
              <h3 className="font-headline text-lg font-bold text-txt mb-1">Join the Waitlist</h3>
              <p className="text-[.78rem] text-txt-2">
                Get early access to $LIMER token launch, exclusive airdrops, and Caribbean DeFi updates.
              </p>
            </div>

            {waitlistCount > 0 && (
              <div className="flex items-center justify-center gap-2 mb-4 text-[.74rem] text-sea">
                <span className="w-2 h-2 rounded-full bg-sea animate-pulse" />
                {waitlistCount.toLocaleString()} people already joined
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-black/30 border border-border text-txt rounded-xl px-4 py-3 font-mono text-[.84rem] outline-none focus:border-sea transition-colors"
              />
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full bg-black/30 border border-border text-txt rounded-xl px-4 py-3 font-mono text-[.84rem] outline-none focus:border-sea transition-colors">
                <option value="">Select your country (optional)</option>
                {CARIBBEAN_COUNTRIES.filter(Boolean).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full px-4 py-3 rounded-xl font-body font-bold text-[.88rem] cursor-pointer border-none bg-sea text-night hover:brightness-90 transition-all disabled:opacity-50">
                {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
              </button>

              {status === 'error' && (
                <p className="text-[.74rem] text-[#FF6B6B] text-center">{errorMsg}</p>
              )}
            </form>

            <p className="text-[.6rem] text-muted text-center mt-3">
              No spam. Unsubscribe anytime. Caribbean-first.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
