import { useMemo } from 'react';
import {
  BufferGeometry,
  Float32BufferAttribute,
  MeshLambertMaterial,
  NearestFilter,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from 'three';
import { COBBLE_URL, type AssetId } from '@/data/assets';
import type { Placement } from '@/data/maps/types';
import { PALETTE } from '@/data/palette';
import { InstancedModel, type Transform } from '@/game/assets/InstancedModel';
import { currentMap } from '@/game/world/current-map';
import { buildRibbon, mergeRibbons, type RibbonMesh } from '@/game/world/ribbon';

const SNOW_GROUND = '#e1e9f2';
const COBBLE_TILE_METERS = 2;
const PLAZA_Y = 0.02;
const ICE_Y = 0.03;
const WATER_Y = 0.04;
const PATH_Y = 0.05;

function groupByAsset(placements: readonly Placement[]): [AssetId, Transform[]][] {
  const groups = new Map<AssetId, Transform[]>();
  for (const p of placements) {
    const list = groups.get(p.asset) ?? [];
    list.push({ x: p.x, z: p.z, rotY: p.rotY, scale: p.scale });
    groups.set(p.asset, list);
  }
  return [...groups];
}

function RibbonMeshView({ data, color }: { data: RibbonMesh; color: string }) {
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(data.positions, 3));
    g.setIndex(data.indices);
    g.computeVertexNormals();
    return g;
  }, [data]);
  const material = useMemo(() => new MeshLambertMaterial({ color }), [color]);
  return <mesh geometry={geometry} material={material} />;
}

function CobblePlaza({ cx, cz, w, d }: { cx: number; cz: number; w: number; d: number }) {
  const material = useMemo(() => {
    const texture = new TextureLoader().load(COBBLE_URL);
    texture.colorSpace = SRGBColorSpace;
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
    texture.generateMipmaps = false;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(w / COBBLE_TILE_METERS, d / COBBLE_TILE_METERS);
    return new MeshLambertMaterial({ map: texture });
  }, [w, d]);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[cx, PLAZA_Y, cz]} material={material}>
      <planeGeometry args={[w, d]} />
    </mesh>
  );
}

export function MapScene() {
  const map = currentMap;
  const groups = useMemo(() => groupByAsset(map.placements), [map]);
  const ice = useMemo(() => buildRibbon(map.river.ribbon.points, map.river.iceWidth, ICE_Y), [map]);
  const water = useMemo(
    () => buildRibbon(map.river.ribbon.points, map.river.ribbon.width, WATER_Y),
    [map],
  );
  const paths = useMemo(
    () => mergeRibbons(map.paths.map((r) => buildRibbon(r.points, r.width, PATH_Y))),
    [map],
  );

  return (
    <>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[400, 400]} />
        <meshLambertMaterial color={SNOW_GROUND} />
      </mesh>
      <CobblePlaza {...map.plaza} />
      {map.paths.length > 0 && <RibbonMeshView data={paths} color={PALETTE.frost} />}
      <RibbonMeshView data={ice} color={PALETTE.slate_light} />
      <RibbonMeshView data={water} color={PALETTE.slate} />
      {groups.map(([id, transforms]) => (
        <InstancedModel key={id} id={id} transforms={transforms} />
      ))}
    </>
  );
}
