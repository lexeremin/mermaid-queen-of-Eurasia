// Usage: npm run assets:optimize
// assets-src/*.glb (raw Blender export) -> public/assets/<category>/*.glb (deduped, welded, meshopt-compressed)
import { copyFile, mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { MeshoptEncoder } from 'meshoptimizer';
import { dedup, meshopt, prune, reorder, weld } from '@gltf-transform/functions';
import { categoryOf, createIO } from './gltf-io.mjs';

const SRC = 'assets-src';
const OUT = 'public/assets';

const io = await createIO();
const files = (await readdir(SRC)).filter((f) => f.endsWith('.glb'));

for (const file of files) {
  const doc = await io.read(path.join(SRC, file));
  await doc.transform(
    dedup(),
    weld(),
    prune({ keepLeaves: true }),
    reorder({ encoder: MeshoptEncoder }),
    meshopt({ encoder: MeshoptEncoder, level: 'high' }),
  );
  const dir = path.join(OUT, categoryOf(file));
  await mkdir(dir, { recursive: true });
  const out = path.join(dir, file);
  await io.write(out, doc);
  const before = (await stat(path.join(SRC, file))).size;
  const after = (await stat(out)).size;
  console.log(`${file}: ${(before / 1024).toFixed(1)} KB -> ${(after / 1024).toFixed(1)} KB`);
}

await mkdir(path.join(OUT, 'atlas'), { recursive: true });
await copyFile(path.join(SRC, 'palette_atlas.png'), path.join(OUT, 'atlas', 'palette_atlas.png'));
console.log('palette_atlas.png copied');
