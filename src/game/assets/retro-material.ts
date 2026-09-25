import {
  MeshLambertMaterial,
  NearestFilter,
  SRGBColorSpace,
  TextureLoader,
  type Object3D,
} from 'three';
import { ATLAS_URL } from '@/data/assets';

let shared: MeshLambertMaterial | undefined;

/** Screen-door (ordered dither) fade: an instanced mesh with an `instanceFade` attribute below 1 turns see-through. */
type ShaderSource = { vertexShader: string; fragmentShader: string };
function addInstanceFade(shader: ShaderSource): void {
  shader.vertexShader = shader.vertexShader
    .replace(
      '#include <common>',
      `#include <common>
varying float vInstanceFade;
#ifdef USE_INSTANCING
attribute float instanceFade;
#endif`,
    )
    .replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
#ifdef USE_INSTANCING
vInstanceFade = instanceFade;
#else
vInstanceFade = 1.0;
#endif`,
    );
  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      `#include <common>
varying float vInstanceFade;
float bayer4(vec2 p) {
  int x = int(mod(p.x, 4.0));
  int y = int(mod(p.y, 4.0));
  float m[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);
  return (m[x + 4 * y] + 0.5) / 16.0;
}`,
    )
    .replace(
      'void main() {',
      `void main() {
  if (vInstanceFade < 0.999 && bayer4(gl_FragCoord.xy) > vInstanceFade) discard;`,
    );
}

export function getRetroMaterial(): MeshLambertMaterial {
  if (!shared) {
    const atlas = new TextureLoader().load(ATLAS_URL);
    atlas.colorSpace = SRGBColorSpace;
    atlas.magFilter = NearestFilter;
    atlas.minFilter = NearestFilter;
    atlas.generateMipmaps = false;
    atlas.flipY = false;
    shared = new MeshLambertMaterial({ map: atlas });
    shared.onBeforeCompile = addInstanceFade;
    shared.customProgramCacheKey = () => 'retro-instance-fade';
  }
  return shared;
}

export function applyRetroMaterial(root: Object3D): void {
  const material = getRetroMaterial();
  root.traverse((child) => {
    if ('isMesh' in child && child.isMesh) {
      (child as unknown as { material: MeshLambertMaterial }).material = material;
    }
  });
}
