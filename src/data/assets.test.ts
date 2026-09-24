import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('shipped assets', () => {
  it('pass the budget, manifest and licence-ledger check', () => {
    const output = execFileSync(process.execPath, ['tools/check-assets.mjs'], { encoding: 'utf8' });
    expect(output).toContain('Asset check passed');
  }, 30_000);
});
