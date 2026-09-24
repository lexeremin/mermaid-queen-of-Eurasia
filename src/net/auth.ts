import { getClient } from '@/net/client';

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'disabled' | 'network' | 'other'; message: string };

let cached: string | null = null;

/** Anonymous session: reuse the stored one, otherwise sign in anonymously. Never throws. */
export async function ensureUser(): Promise<AuthResult> {
  if (cached) return { ok: true, userId: cached };
  const pending = getClient();
  if (!pending) return { ok: false, reason: 'other', message: 'not configured' };
  try {
    const client = await pending;
    const existing = await client.auth.getSession();
    const known = existing.data.session?.user.id;
    if (known) {
      cached = known;
      return { ok: true, userId: known };
    }
    const { data, error } = await client.auth.signInAnonymously();
    if (error) {
      const disabled =
        error.code === 'anonymous_provider_disabled' ||
        /anonymous sign-ins are disabled/i.test(error.message);
      const network = /fetch|network|timeout/i.test(error.name + error.message) && !disabled;
      return {
        ok: false,
        reason: disabled ? 'disabled' : network ? 'network' : 'other',
        message: error.message,
      };
    }
    cached = data.user?.id ?? null;
    return cached
      ? { ok: true, userId: cached }
      : { ok: false, reason: 'other', message: 'no user returned' };
  } catch (error) {
    return {
      ok: false,
      reason: 'network',
      message: error instanceof Error ? error.message : 'network error',
    };
  }
}

export function currentUserId(): string | null {
  return cached;
}
