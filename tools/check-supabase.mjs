// Usage: npm run supabase:check
// Verifies the Supabase project: anonymous sign-in, tables, and RLS isolation between two anonymous users.
// Reads .env; prints results only (never keys). Cleans up nothing it cannot: rows belong to throwaway users.
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env');
  process.exit(1);
}
if (key.startsWith('sb_secret_')) {
  console.error(
    'That is a SECRET key. Use the publishable/anon key instead, and rotate the secret key.',
  );
  process.exit(1);
}

const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`);
};
const client = () =>
  createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const a = client();
const signInA = await a.auth.signInAnonymously();
check('anonymous sign-in (user A)', !signInA.error, signInA.error?.message ?? '');
if (signInA.error) {
  console.error(
    '\nEnable it: Supabase dashboard > Authentication > Sign In / Providers > Anonymous sign-ins.',
  );
  process.exit(1);
}
const b = client();
const signInB = await b.auth.signInAnonymously();
check('anonymous sign-in (user B)', !signInB.error, signInB.error?.message ?? '');
const idA = signInA.data.user.id;

const now = new Date().toISOString();
const own = await a.from('players').upsert({ id: idA, device_class: 'desktop', last_seen_at: now });
check('A can write own player row', !own.error, own.error?.message ?? '');
if (own.error?.code === 'PGRST205' || own.error?.code === '42P01') {
  console.error(
    '\nTables are missing. Run supabase/migrations/20260924120000_init.sql in the SQL Editor.',
  );
  process.exit(1);
}

const save = await a
  .from('saves')
  .upsert({ player_id: idA, version: 1, data: { hello: 'A' }, saved_at: now });
check('A can write own save', !save.error, save.error?.message ?? '');
const readOwn = await a.from('saves').select('player_id').eq('player_id', idA);
check('A can read own save', !readOwn.error && readOwn.data.length === 1);
const readOther = await b.from('saves').select('player_id').eq('player_id', idA);
check("B cannot read A's save", !readOther.error && readOther.data.length === 0);
const forge = await b
  .from('saves')
  .upsert({ player_id: idA, version: 1, data: { hello: 'forged' }, saved_at: now });
check("B cannot write A's save", !!forge.error, forge.error?.code ?? '');
const stillA = await a.from('saves').select('data').eq('player_id', idA).single();
check("A's save is unchanged", stillA.data?.data?.hello === 'A');

const eventId = randomUUID();
const ev = { id: eventId, player_id: idA, type: 'check', payload: { ok: true }, client_ts: now };
const insertEvent = await a
  .from('stat_events')
  .upsert(ev, { onConflict: 'id', ignoreDuplicates: true });
check('A can insert a stat event', !insertEvent.error, insertEvent.error?.message ?? '');
const again = await a.from('stat_events').upsert(ev, { onConflict: 'id', ignoreDuplicates: true });
check('duplicate event id is ignored (idempotent)', !again.error, again.error?.message ?? '');
const spoof = await b.from('stat_events').insert({ ...ev, id: randomUUID() });
check('B cannot insert events as A', !!spoof.error, spoof.error?.code ?? '');
const readEvents = await b.from('stat_events').select('id').eq('player_id', idA);
check("B cannot read A's events", !readEvents.error && readEvents.data.length === 0);
const update = await a.from('stat_events').update({ type: 'edited' }).eq('id', eventId).select();
check('events cannot be edited by their owner', !update.error && update.data.length === 0);
const del = await a.from('stat_events').delete().eq('id', eventId).select();
check('events cannot be deleted by their owner', !del.error && del.data.length === 0);
const big = await a.from('stat_events').insert({
  id: randomUUID(),
  player_id: idA,
  type: 'big',
  payload: { x: 'y'.repeat(5000) },
  client_ts: now,
});
check('oversized payload is rejected', !!big.error, big.error?.code ?? '');
const anon = client();
const anonRead = await anon.from('saves').select('player_id').limit(1);
check('signed-out client sees nothing', !!anonRead.error || anonRead.data.length === 0);

const failed = results.filter((r) => !r).length;
console.log(failed === 0 ? '\nAll checks passed.' : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
