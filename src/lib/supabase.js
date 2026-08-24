import { createClient } from '@supabase/supabase-js';

// Get credentials from Vite ENV or saved custom localStorage config
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const localUrl = localStorage.getItem('supabase_url');
  const localKey = localStorage.getItem('supabase_anon_key');

  const url = (localUrl || envUrl || '').trim();
  const key = (localKey || envKey || '').trim();

  const isConfigured = Boolean(
    url && 
    key && 
    url !== 'https://your-project-ref.supabase.co' && 
    key !== 'your-anon-key-here'
  );

  return { url, key, isConfigured };
};

let supabaseInstance = null;

export const getSupabaseClient = () => {
  const { url, key, isConfigured } = getSupabaseConfig();
  
  if (!isConfigured) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
};

export const resetSupabaseClient = () => {
  supabaseInstance = null;
  return getSupabaseClient();
};
