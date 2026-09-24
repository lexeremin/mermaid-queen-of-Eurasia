import { useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute, MeshLambertMaterial } from 'three';
import type { AssetId } from '@/data/assets';
import type { Placement } from '@/data/maps/types';
import { PALETTE } from '@/data/palette';
import { InstancedModel, type Transform } from '@/game/assets/InstancedModel';
import { currentMap } from '@/game/world/current-map';
import { buildRibbon, mergeRibbons, type RibbonMesh } from '@/game/world/ribbon';

const GROUND_COLOR = '#e1e9f2';
const TRAMPLED_SNOW = '#c6d3e2';
const ICE_Y = 0.02;
const WATER_Y = 0.03;
const SQUARE_Y = 0.035;
const PATH_Y = 0.04;

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

export function Village() {
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
        <planeGeometry args={[220, 220]} />
        <meshLambertMaterial color={GROUND_COLOR} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[map.square.x, SQUARE_Y, map.square.z]}>
        <circleGeometry args={[map.square.r, 28]} />
        <meshLambertMaterial color={TRAMPLED_SNOW} />
      </mesh>
      <RibbonMeshView data={paths} color={TRAMPLED_SNOW} />
      <RibbonMeshView data={ice} color={PALETTE.slate_light} />
      <RibbonMeshView data={water} color={PALETTE.slate} />
      {groups.map(([id, transforms]) => (
        <InstancedModel key={id} id={id} transforms={transforms} />
      ))}
    </>
  );
}
