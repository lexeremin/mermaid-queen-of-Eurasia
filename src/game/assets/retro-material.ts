import {
  MeshLambertMaterial,
  NearestFilter,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type Object3D,
} from 'three';
import { ATLAS_URL } from '@/data/assets';

let shared: MeshLambertMaterial | undefined;
let fading: MeshLambertMaterial | undefined;
let atlasTexture: Texture | undefined;

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

function getAtlas(): Texture {
  if (!atlasTexture) {
    const atlas = new TextureLoader().load(ATLAS_URL);
    atlas.colorSpace = SRGBColorSpace;
    atlas.magFilter = NearestFilter;
    atlas.minFilter = NearestFilter;
    atlas.generateMipmaps = false;
    atlas.flipY = false;
    atlasTexture = atlas;
  }
  return atlasTexture;
}

/**
 * The plain palette material: no `discard` anywhere in its shader, so the GPU keeps early depth testing (phones and
 * Apple GPUs lose a lot of speed when a fragment shader can discard). Used by everything that never fades.
 */
export function getRetroMaterial(): MeshLambertMaterial {
  shared ??= new MeshLambertMaterial({ map: getAtlas() });
  return shared;
}

/** The same material with the see-through dither: only for tall buildings and props that can hide Rosa. */
export function getFadeMaterial(): MeshLambertMaterial {
  if (!fading) {
    fading = new MeshLambertMaterial({ map: getAtlas() });
    fading.onBeforeCompile = addInstanceFade;
    fading.customProgramCacheKey = () => 'retro-instance-fade';
  }
  return fading;
}

export function applyRetroMaterial(root: Object3D): void {
  const material = getRetroMaterial();
  root.traverse((child) => {
    if ('isMesh' in child && child.isMesh) {
      (child as unknown as { material: MeshLambertMaterial }).material = material;
    }
  });
}
