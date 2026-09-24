// Usage: npm run assets:check
// Verifies every shipped GLB against tools/asset-budgets.json, the manifest and the licence ledger.
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { categoryOf, createIO } from './gltf-io.mjs';

const ROOT = 'public/assets';
const budgets = JSON.parse(await readFile('tools/asset-budgets.json', 'utf8'));
const manifest = await readFile('src/data/assets.ts', 'utf8');
const ledger = await readFile('docs/asset-ledger.md', 'utf8');
const io = await createIO();

const problems = [];
const rows = [];

for (const dir of await readdir(ROOT, { withFileTypes: true })) {
  if (!dir.isDirectory() || dir.name === 'atlas') continue;
  for (const file of (await readdir(path.join(ROOT, dir.name))).filter((f) => f.endsWith('.glb'))) {
    const relative = `/assets/${dir.name}/${file}`;
    const budget = budgets[categoryOf(file)];
    if (!budget) {
      problems.push(`${file}: unknown category "${categoryOf(file)}"`);
      continue;
    }
    if (dir.name !== categoryOf(file))
      problems.push(`${file}: stored in wrong folder "${dir.name}"`);

    const full = path.join(ROOT, dir.name, file);
    const kb = (await stat(full)).size / 1024;
    const doc = await io.read(full);

    let tris = 0;
    for (const mesh of doc.getRoot().listMeshes()) {
      for (const prim of mesh.listPrimitives()) {
        const indices = prim.getIndices();
        const count = indices ? indices.getCount() : prim.getAttribute('POSITION').getCount();
        tris += count / 3;
      }
    }
    let texture = 0;
    for (const tex of doc.getRoot().listTextures()) {
      const [w, h] = tex.getSize() ?? [0, 0];
      texture = Math.max(texture, w, h);
    }

    if (tris > budget.maxTris) problems.push(`${file}: ${tris} tris > ${budget.maxTris}`);
    if (kb > budget.maxKB) problems.push(`${file}: ${kb.toFixed(1)} KB > ${budget.maxKB} KB`);
    if (texture > budget.maxTexture)
      problems.push(`${file}: texture ${texture}px > ${budget.maxTexture}px`);
    if (!manifest.includes(relative)) problems.push(`${file}: missing from src/data/assets.ts`);
    if (!ledger.includes(file)) problems.push(`${file}: missing from docs/asset-ledger.md`);
    rows.push(
      `${file.padEnd(20)} ${String(tris).padStart(5)} tris  ${kb.toFixed(1).padStart(6)} KB  tex ${texture}px`,
    );
  }
}

console.log(rows.join('\n'));
if (problems.length > 0) {
  console.error(`\nAsset check FAILED:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`\nAsset check passed (${rows.length} assets).`);
