export type SupabaseConfig = { url: string; key: string };
export type ConfigCheck = { config: SupabaseConfig | null; problem: string | null };

type Env = Record<string, string | undefined>;

function jwtRole(key: string): string | null {
  const payload = key.split('.')[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const role = (JSON.parse(json) as { role?: unknown }).role;
    return typeof role === 'string' ? role : null;
  } catch {
    return null;
  }
}

/** Reads and validates the Supabase settings. Secret and service-role keys are refused. */
export function checkSupabaseConfig(env: Env): ConfigCheck {
  const url = env.VITE_SUPABASE_URL?.trim();
  const key = (env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY)?.trim();
  if (!url || !key) return { config: null, problem: null };
  if (key.startsWith('sb_secret_') || jwtRole(key) === 'service_role') {
    return { config: null, problem: 'Refusing a secret key: use the publishable/anon key.' };
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
      return { config: null, problem: 'Supabase URL must use https.' };
    }
  } catch {
    return { config: null, problem: 'Supabase URL is not a valid URL.' };
  }
  return { config: { url, key }, problem: null };
}
