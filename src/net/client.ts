import type { SupabaseClient } from '@supabase/supabase-js';
import { checkSupabaseConfig, type ConfigCheck } from '@/net/config';

// Read each variable explicitly: handing over the whole env object would bundle every VITE_ variable.
export const configCheck: ConfigCheck = checkSupabaseConfig({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

let clientPromise: Promise<SupabaseClient> | null = null;

/** The Supabase library is loaded only when the game is actually configured for it. */
export function getClient(): Promise<SupabaseClient> | null {
  const { config } = configCheck;
  if (!config) return null;
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(config.url, config.key, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'mq.supabase.auth' },
    }),
  );
  return clientPromise;
}
