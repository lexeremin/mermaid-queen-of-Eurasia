import { useMemo } from 'react';
import {
  LinearFilter,
  LinearMipmapLinearFilter,
  MeshLambertMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from 'three';
import { COBBLE_ATLAS_URL } from '@/data/assets';
import { currentMap } from '@/game/world/current-map';
import { rasterize } from '@/game/world/ground-grid';
import { buildKerb, buildPaving } from '@/game/world/paving-geometry';

const PLAVING_Y = 0.02;
const KERB_COLOR = '#8f97a3';

/**
 * All paved ground (plazas and lanes) as one mesh: the map's shapes are rasterized to a grid, each 4 m block
 * gets one of four cobble variants (flipped at random) and a kerb runs along every exposed edge.
 */
export function GroundPaving() {
  const built = useMemo(() => {
    const grid = rasterize(currentMap.bounds, currentMap.plazas, currentMap.lanes ?? []);
    return {
      paving: buildPaving(grid, PLAVING_Y),
      kerb: buildKerb(grid, PLAVING_Y, currentMap.entrances ?? []),
    };
  }, []);
  const pavingMaterial = useMemo(() => {
    const texture = new TextureLoader().load(COBBLE_ATLAS_URL);
    texture.colorSpace = SRGBColorSpace;
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 8;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    return new MeshLambertMaterial({ map: texture });
  }, []);
  const kerbMaterial = useMemo(() => new MeshLambertMaterial({ color: KERB_COLOR }), []);

  return (
    <>
      <mesh geometry={built.paving} material={pavingMaterial} />
      <mesh geometry={built.kerb} material={kerbMaterial} />
    </>
  );
}
