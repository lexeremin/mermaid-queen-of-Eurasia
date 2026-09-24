import {
  MeshLambertMaterial,
  NearestFilter,
  SRGBColorSpace,
  TextureLoader,
  type Object3D,
} from 'three';
import { ATLAS_URL } from '@/data/assets';

let shared: MeshLambertMaterial | undefined;

export function getRetroMaterial(): MeshLambertMaterial {
  if (!shared) {
    const atlas = new TextureLoader().load(ATLAS_URL);
    atlas.colorSpace = SRGBColorSpace;
    atlas.magFilter = NearestFilter;
    atlas.minFilter = NearestFilter;
    atlas.generateMipmaps = false;
    atlas.flipY = false;
    shared = new MeshLambertMaterial({ map: atlas });
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
