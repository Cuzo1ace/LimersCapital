/**
 * Supabase API layer — users, leaderboard, waitlist.
 *
 * Every function is fire-and-forget safe: if Supabase is
 * unreachable the app continues with localStorage state.
 */
import { supabase, isSupabaseReady } from '../lib/supabase';

// ── USERS ────────────────────────────────────────────────────

/**
 * Upsert a user profile on wallet connect.
 * Creates the row if new, updates stats if existing.
 */
export async function upsertUser({
  walletAddress,
  referralCode,
  xp = 0,
  limerPoints = 0,
  tier = 'Guppy',
  currentStreak = 0,
  longestStreak = 0,
  tradesCount = 0,
  lessonsCount = 0,
  country = null,
}) {
  if (!isSupabaseReady()) return null;

  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        wallet_address: walletAddress,
        referral_code: referralCode,
        xp,
        limer_points: limerPoints,
        tier,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        trades_count: tradesCount,
        lessons_count: lessonsCount,
        country,
      },
      { onConflict: 'wallet_address' },
    )
    .select()
    .single();

  if (error) {
    console.warn('[Supabase] upsertUser failed:', error.message);
    return null;
  }
  return data;
}

/**
 * Sync local stats to Supabase (called periodically or on key events).
 */
export async function syncUserStats(walletAddress, stats) {
  if (!isSupabaseReady() || !walletAddress) return null;

  const { data, error } = await supabase
    .from('users')
    .update({
      xp: stats.xp,
      limer_points: stats.limerPoints,
      tier: stats.tier,
      current_streak: stats.currentStreak,
      longest_streak: stats.longestStreak,
      trades_count: stats.tradesCount,
      lessons_count: stats.lessonsCount,
    })
    .eq('wallet_address', walletAddress)
    .select()
    .single();

  if (error) {
    console.warn('[Supabase] syncUserStats failed:', error.message);
    return null;
  }
  return data;
}

/**
 * Record a referral relationship.
 */
export async function recordReferral(walletAddress, referredByCode) {
  if (!isSupabaseReady() || !walletAddress) return null;

  const { data, error } = await supabase
    .from('users')
    .update({ referred_by: referredByCode })
    .eq('wallet_address', walletAddress)
    .select()
    .single();

  if (error) {
    console.warn('[Supabase] recordReferral failed:', error.message);
    return null;
  }
  return data;
}

/**
 * Fetch a user profile by wallet address.
 */
export async function fetchUser(walletAddress) {
  if (!isSupabaseReady()) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found (not a real error)
    console.warn('[Supabase] fetchUser failed:', error.message);
  }
  return data || null;
}

// ── LEADERBOARD ──────────────────────────────────────────────

/**
 * Fetch top 100 leaderboard from the view.
 */
export async function fetchLeaderboard() {
  if (!isSupabaseReady()) return [];

  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .limit(100);

  if (error) {
    console.warn('[Supabase] fetchLeaderboard failed:', error.message);
    return [];
  }
  return data;
}

/**
 * Get total registered user count (for demo metrics).
 */
export async function getUserCount() {
  if (!isSupabaseReady()) return 0;

  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.warn('[Supabase] getUserCount failed:', error.message);
    return 0;
  }
  return count || 0;
}

// ── WAITLIST ─────────────────────────────────────────────────

/**
 * Add email to the waitlist.
 */
export async function joinWaitlist({ email, country = null, source = 'website', walletAddress = null }) {
  if (!isSupabaseReady()) return { success: false, error: 'Backend unavailable' };

  const { data, error } = await supabase
    .from('waitlist')
    .upsert(
      {
        email,
        country,
        source,
        wallet_address: walletAddress,
      },
      { onConflict: 'email' },
    )
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Already on waitlist
      return { success: true, alreadyJoined: true };
    }
    console.warn('[Supabase] joinWaitlist failed:', error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

/**
 * Get waitlist count (for social proof on landing page).
 *
 * Uses the SECURITY DEFINER RPC `waitlist_count` rather than selecting
 * from the table directly. Migration 009 (audit Backend H-05, 2026-04-18)
 * revoked anon SELECT on public.waitlist to close the email-harvest PII
 * breach. The RPC returns only the scalar count, no row data.
 */
export async function getWaitlistCount() {
  if (!isSupabaseReady()) return 0;

  const { data, error } = await supabase.rpc('waitlist_count');

  if (error) {
    console.warn('[Supabase] getWaitlistCount failed:', error.message);
    return 0;
  }
  return typeof data === 'number' ? data : 0;
}

// ── ACTIVITY FEED ────────────────────────────────────────────

/**
 * Log a user activity event (trade, lesson, badge, etc.)
 */
export async function logActivity({ walletAddress, eventType, icon, description, country = null, metadata = {} }) {
  if (!isSupabaseReady()) return null;

  const { error } = await supabase
    .from('activity_feed')
    .insert({
      wallet_address: walletAddress,
      event_type: eventType,
      icon,
      description,
      country,
      metadata,
    });

  if (error) console.warn('[Supabase] logActivity failed:', error.message);
}

/**
 * Fetch recent activity feed (last N events, anonymized).
 */
export async function fetchActivityFeed(limit = 20) {
  if (!isSupabaseReady()) return [];

  const { data, error } = await supabase
    .from('activity_feed')
    .select('id, event_type, icon, description, country, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[Supabase] fetchActivityFeed failed:', error.message);
    return [];
  }
  return data;
}

// ── LISTING APPLICATIONS ─────────────────────────────────────

/**
 * Submit a company listing application.
 */
export async function submitListing({ company, contact, email, tier, message, walletAddress = null }) {
  if (!isSupabaseReady()) return { success: false, error: 'Backend unavailable' };

  const { data, error } = await supabase
    .from('listing_applications')
    .insert({ company, contact, email, tier, message, wallet_address: walletAddress })
    .select()
    .single();

  if (error) {
    console.warn('[Supabase] submitListing failed:', error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

// ── ANNOUNCEMENTS ────────────────────────────────────────────

/**
 * Fetch active announcements.
 */
export async function fetchAnnouncements() {
  if (!isSupabaseReady()) return [];

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('active', true)
    .lte('starts_at', now)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('priority', { ascending: false })
    .limit(5);

  if (error) {
    console.warn('[Supabase] fetchAnnouncements failed:', error.message);
    return [];
  }
  return data;
}

// ── FEEDBACK ─────────────────────────────────────────────────

/**
 * Submit user feedback / bug report.
 */
export async function submitFeedback({ walletAddress = null, email = null, category = 'general', message, page = null }) {
  if (!isSupabaseReady()) return { success: false, error: 'Backend unavailable' };

  const { data, error } = await supabase
    .from('feedback')
    .insert({ wallet_address: walletAddress, email, category, message, page })
    .select()
    .single();

  if (error) {
    console.warn('[Supabase] submitFeedback failed:', error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

// ── COMPETITION ENTRIES ──────────────────────────────────────

/**
 * Register for a competition or update scores.
 */
export async function upsertCompetitionEntry({ competitionId = 'season-1', walletAddress, displayName, pnlPct = 0, tradesCount = 0, winRate = 0, maxDrawdown = 0, score = 0 }) {
  if (!isSupabaseReady() || !walletAddress) return null;

  const { data, error } = await supabase
    .from('competition_entries')
    .upsert(
      {
        competition_id: competitionId,
        wallet_address: walletAddress,
        display_name: displayName,
        pnl_pct: pnlPct,
        trades_count: tradesCount,
        win_rate: winRate,
        max_drawdown: maxDrawdown,
        score,
      },
      { onConflict: 'competition_id,wallet_address' },
    )
    .select()
    .single();

  if (error) {
    console.warn('[Supabase] upsertCompetitionEntry failed:', error.message);
    return null;
  }
  return data;
}

/**
 * Fetch competition leaderboard.
 */
export async function fetchCompetitionLeaderboard(competitionId = 'season-1') {
  if (!isSupabaseReady()) return [];

  const { data, error } = await supabase
    .from('competition_entries')
    .select('*')
    .eq('competition_id', competitionId)
    .order('score', { ascending: false })
    .limit(100);

  if (error) {
    console.warn('[Supabase] fetchCompetitionLeaderboard failed:', error.message);
    return [];
  }
  return data.map((entry, i) => ({ ...entry, rank: i + 1 }));
}

// ── REALTIME ─────────────────────────────────────────────────

/**
 * Subscribe to leaderboard changes (top users table).
 * Returns an unsubscribe function.
 */
export function subscribeLeaderboard(callback) {
  if (!isSupabaseReady()) return () => {};
  // Wrap in try-catch: Supabase realtime WebSocket construction can throw
  // synchronously on Safari/iOS when CSP blocks the wss:// connection or when
  // WebSockets are otherwise unavailable. We don't want this to crash React.
  try {
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          fetchLeaderboard().then(callback).catch(() => {});
        },
      )
      .subscribe();
    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[supabase] realtime unavailable:', e?.message);
    return () => {};
  }
}

/**
 * Subscribe to real-time activity feed.
 * Returns an unsubscribe function.
 */
export function subscribeActivityFeed(callback) {
  if (!isSupabaseReady()) return () => {};
  try {
    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_feed' },
        (payload) => {
          callback(payload.new);
        },
      )
      .subscribe();
    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[supabase] realtime unavailable:', e?.message);
    return () => {};
  }
}

/**
 * Subscribe to announcements (new or updated).
 * Returns an unsubscribe function.
 */
export function subscribeAnnouncements(callback) {
  if (!isSupabaseReady()) return () => {};
  try {
    const channel = supabase
      .channel('announcements')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => {
          fetchAnnouncements().then(callback).catch(() => {});
        },
      )
      .subscribe();
    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[supabase] realtime unavailable:', e?.message);
    return () => {};
  }
}

// ── NEWS & EVENTS ────────────────────────────────────────────

/**
 * Fetch active news items. Filters server-side by source_type when provided.
 * Client re-ranks using freshness × priority × personalization.
 *
 * @param {object} opts
 * @param {'all'|'curated'|'rss'|'ai_summary'|'event'} [opts.sourceType='all']
 * @param {number} [opts.limit=40]
 */
export async function fetchNews({ sourceType = 'all', limit = 40 } = {}) {
  if (!isSupabaseReady()) return [];

  const nowIso = new Date().toISOString();
  let q = supabase
    .from('news_items')
    .select('id, source_type, source_name, source_url, title, summary, body_md, hero_image, tags, tickers, countries, priority, published_at, event_at, expires_at, ai_model')
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (sourceType !== 'all') {
    q = q.eq('source_type', sourceType);
  }

  const { data, error } = await q;
  if (error) {
    console.warn('[Supabase] fetchNews failed:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Fetch upcoming events (source_type='event' with event_at in the future).
 */
export async function fetchEvents({ limit = 10 } = {}) {
  if (!isSupabaseReady()) return [];

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('news_items')
    .select('id, source_name, source_url, title, summary, hero_image, tags, countries, event_at, expires_at')
    .eq('source_type', 'event')
    .gt('event_at', nowIso)
    .order('event_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.warn('[Supabase] fetchEvents failed:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Log a news-read event — reuses activity_feed (no new table).
 * Deduplication (one read per item per day) is enforced client-side via store.
 */
export async function logNewsRead({ walletAddress, newsItemId, title }) {
  return logActivity({
    walletAddress: walletAddress || 'anon',
    eventType: 'news_read',
    icon: '📰',
    description: title ? `Read: ${title.slice(0, 80)}` : 'Read a news item',
    metadata: { news_item_id: newsItemId },
  });
}
