import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qjhdcnkykshdbjwrnygn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqaGRjbmt5a3NoZGJqd3JueWduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1OTIxNjksImV4cCI6MjEwMzE2ODE2OX0.Rw8jMapQ1GbLskGxc52Nk-lDZqBLcXWvQSSHiIL34io';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const getSupabaseConfig = () => ({
  url: supabaseUrl,
  key: supabaseAnonKey,
  isConfigured: true
});

export const getSupabaseClient = () => supabase;
export const resetSupabaseClient = () => supabase;
