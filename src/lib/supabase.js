/**
 * Supabase client — single instance shared across the app.
 *
 * Uses the public anon key (safe to embed in client bundles).
 * Row-Level Security (RLS) on every table ensures users can
 * only read/write their own rows.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — backend features disabled.',
  );
}

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }, // we auth via wallet, not Supabase Auth
      })
    : null;

/** Quick guard — returns true when the client is ready */
export const isSupabaseReady = () => supabase !== null;
