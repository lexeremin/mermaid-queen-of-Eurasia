import { describe, expect, it } from 'vitest';
import { checkSupabaseConfig } from '@/net/config';

const jwt = (role: string) =>
  `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ role })).replace(/=+$/, '')}.signature`;

describe('checkSupabaseConfig', () => {
  const url = 'https://abcdefghijklmnopqrst.supabase.co';

  it('is silently off without settings', () => {
    expect(checkSupabaseConfig({})).toEqual({ config: null, problem: null });
    expect(checkSupabaseConfig({ VITE_SUPABASE_URL: url })).toEqual({
      config: null,
      problem: null,
    });
  });

  it('accepts a publishable key, or the older anon key name', () => {
    const a = checkSupabaseConfig({
      VITE_SUPABASE_URL: url,
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abc',
    });
    expect(a.config).toEqual({ url, key: 'sb_publishable_abc' });
    const b = checkSupabaseConfig({ VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: jwt('anon') });
    expect(b.config?.url).toBe(url);
  });

  it('refuses secret and service-role keys', () => {
    for (const key of ['sb_secret_abc', jwt('service_role')]) {
      const result = checkSupabaseConfig({
        VITE_SUPABASE_URL: url,
        VITE_SUPABASE_PUBLISHABLE_KEY: key,
      });
      expect(result.config).toBeNull();
      expect(result.problem).toContain('secret');
    }
  });

  it('refuses bad urls', () => {
    const key = 'sb_publishable_abc';
    expect(
      checkSupabaseConfig({ VITE_SUPABASE_URL: 'not a url', VITE_SUPABASE_PUBLISHABLE_KEY: key })
        .problem,
    ).toBeTruthy();
    expect(
      checkSupabaseConfig({
        VITE_SUPABASE_URL: 'http://example.com',
        VITE_SUPABASE_PUBLISHABLE_KEY: key,
      }).problem,
    ).toContain('https');
  });
});
