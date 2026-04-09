/**
 * Supabase client — single instance shared across the app.
 *
 * Uses the public anon key (safe to embed in client bundles).
 * Row-Level Security (RLS) on every table ensures users can
 * only read/write their own rows.
 */
import { createClient } from '@supabase/supabase-js';

// Public values — safe to embed in client bundles. RLS protects all data.
// Env var override available for local dev or alternative projects.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uszaeqtrifenpibptvus.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzemFlcXRyaWZlbnBpYnB0dnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2OTAxMDUsImV4cCI6MjA5MTI2NjEwNX0.26KtiCqdgBix2OvNLfpf5ptYIgFmHTfAWaS1T1EO9-w';

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }, // we auth via wallet, not Supabase Auth
      })
    : null;

/** Quick guard — returns true when the client is ready */
export const isSupabaseReady = () => supabase !== null;
