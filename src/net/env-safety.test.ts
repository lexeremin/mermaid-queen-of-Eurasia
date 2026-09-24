import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) && !name.endsWith('.test.ts') ? [full] : [];
  });
}

describe('client env safety', () => {
  const uses = sourceFiles('src').flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(/import\.meta\.env(\.\w+)?/g)].map((m) => ({
      file,
      use: m[0],
    })),
  );

  it('never reads the whole import.meta.env object (it would bundle every VITE_ variable)', () => {
    expect(uses.filter((u) => u.use === 'import.meta.env')).toEqual([]);
  });

  it('only reads an allow-list of variables', () => {
    const allowed = new Set([
      'import.meta.env.DEV',
      'import.meta.env.VITE_SUPABASE_URL',
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY',
      'import.meta.env.VITE_SUPABASE_ANON_KEY',
    ]);
    expect(uses.filter((u) => !allowed.has(u.use))).toEqual([]);
  });

  it('never references a secret-looking VITE_ variable', () => {
    for (const file of sourceFiles('src')) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/VITE_[A-Z_]*(SECRET|SERVICE)/);
    }
  });
});
