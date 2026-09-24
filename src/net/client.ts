import type { SupabaseClient } from '@supabase/supabase-js';
import { checkSupabaseConfig, type ConfigCheck } from '@/net/config';

export const configCheck: ConfigCheck = checkSupabaseConfig(import.meta.env);

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
