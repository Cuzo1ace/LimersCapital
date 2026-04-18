-- ────────────────────────────────────────────────────────────────────
-- 009_lockdown_rls.sql
-- Audit remediation: Backend C-01, H-05, M-07 (2026-04-18)
--
-- Drops the permissive `using (true) / with check (true)` policies on
-- every table that carries user state with anon-reachable writes. The
-- public anon JWT is embedded in the frontend bundle at src/lib/supabase.js
-- so "client-side + trust" is not a viable security model.
--
-- KNOWN FEATURE BREAKAGE after applying this migration:
--   1. Frontend-initiated writes to public.users (xp/limer_points/
--      streak/tier updates) will 403. UI will stop reflecting live XP
--      changes until a signed-message edge function exists to validate
--      wallet-authorized mutations. Reads still work; profile pages
--      and leaderboards continue to render the last-saved values.
--   2. Frontend-initiated INSERTs to public.activity_feed will 403.
--      Users will not see their own actions appear in the community
--      feed. Backend-seeded activity remains visible.
--   3. Frontend-initiated UPDATEs to public.competition_entries will
--      403. Users can still register (INSERT) and view (SELECT) entries
--      but cannot update their own score from the client.
--   4. Frontend-initiated INSERTs to public.announcements will 403.
--      Announcements must be created via service-role key (correct).
--   5. Frontend reads of public.feedback will 403. Any admin UI that
--      lists feedback must move to service-role.
--
-- KEPT (for now, low risk):
--   - public.users SELECT (leaderboard display)
--   - public.users INSERT (new user profile creation — frontend-initiated
--     onboarding is the intended path and the row has nothing to steal
--     at creation time; abuse vector is creating spam rows, already
--     IP-rate-limited by the Worker)
--   - public.waitlist INSERT (email signup)
--   - public.activity_feed SELECT (feed display)
--   - public.listing_applications INSERT + SELECT (business contact form)
--   - public.announcements SELECT (banner display)
--   - public.feedback INSERT (user feedback submission)
--   - public.competition_entries INSERT + SELECT (signup + view)
--
-- PII FIX: public.waitlist SELECT is DROPPED to close the email-harvest
-- breach (Backend H-05). The marketing-page "waitlist count" display
-- should call the new `waitlist_count()` SECURITY DEFINER function
-- instead of reading rows directly. Frontend update required:
--   - Replace `supabase.from('waitlist').select('id', { count: 'exact' })`
--     with `supabase.rpc('waitlist_count')` in src/api/supabase.js.
--
-- TO ROLL BACK: manually recreate the dropped policies from 001+002
-- (or `git revert` the commit that applies this migration). Low risk
-- rollback — the dropped policies are captured in prior migrations.
-- ────────────────────────────────────────────────────────────────────

-- ── public.users ────────────────────────────────────────────────────
-- CRITICAL: remove anon UPDATE capability. Without this, any caller
-- with the public anon key (baked into the JS bundle) can PATCH any
-- user's xp/limer_points/tier. Leaderboard + LP badges become
-- attacker-controlled cosmetic data.
drop policy if exists "Anyone can update user profiles" on public.users;

-- ── public.waitlist ─────────────────────────────────────────────────
-- PII: remove anon SELECT. Emails are not disclosed as public.
drop policy if exists "Waitlist is publicly readable" on public.waitlist;

-- Provide a SECURITY DEFINER wrapper that exposes ONLY the scalar count
-- to the anon role. Frontend calls via supabase.rpc('waitlist_count').
create or replace function public.waitlist_count()
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::int from public.waitlist;
$$;
comment on function public.waitlist_count() is
  'Audit Backend H-05: returns scalar waitlist count without exposing row-level data.';
grant execute on function public.waitlist_count() to anon, authenticated;

-- ── public.activity_feed ────────────────────────────────────────────
-- Feed poisoning — anon INSERT allowed fake activity entries to show
-- up as real community actions. Removed; keep anon SELECT so legitimate
-- feed content remains visible.
drop policy if exists "Anyone can log activity" on public.activity_feed;

-- ── public.announcements ────────────────────────────────────────────
-- Banner takeover — anon INSERT allowed arbitrary messages to render
-- site-wide (phishing, social engineering). Announcements must be
-- service-role only from now on.
drop policy if exists "Anyone can create announcements" on public.announcements;

-- ── public.feedback ─────────────────────────────────────────────────
-- User feedback text is sometimes sensitive (complaints, account
-- issues). Remove public SELECT; admin UI should move to service-role.
drop policy if exists "Feedback is readable" on public.feedback;

-- ── public.competition_entries ──────────────────────────────────────
-- Score rewriting — anon UPDATE allowed any caller to overwrite any
-- competitor's score. Removed. Scoring must flow through a signed-
-- message edge function when it's built.
drop policy if exists "Anyone can update competition entries" on public.competition_entries;

-- ── Optional: tighten listing_applications SELECT ───────────────────
-- Kept as public SELECT today (non-PII business contact form).
-- Flagged for review: if applications start carrying personal phone
-- numbers or home addresses, revoke SELECT and expose a count via
-- SECURITY DEFINER following the waitlist pattern above.
-- (No change made in this migration — just documented.)

comment on table public.users is
  'Anon SELECT + INSERT allowed; UPDATE removed 2026-04-18 (audit C-01). Client-initiated stat updates require signed-message edge function.';
comment on table public.waitlist is
  'Anon INSERT only; SELECT removed 2026-04-18 (audit H-05). Use waitlist_count() for scalar count.';
comment on table public.activity_feed is
  'Anon SELECT only; INSERT removed 2026-04-18 (audit C-01). Service role writes legitimate feed entries.';
comment on table public.announcements is
  'Anon SELECT only; INSERT removed 2026-04-18 (audit M-07). Service role posts announcements.';
comment on table public.feedback is
  'Anon INSERT only; SELECT removed 2026-04-18 (audit C-01). Admin UI uses service role.';
comment on table public.competition_entries is
  'Anon SELECT + INSERT allowed; UPDATE removed 2026-04-18 (audit C-01). Score updates require signed-message edge function.';
