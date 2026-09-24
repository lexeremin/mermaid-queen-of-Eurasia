import { useMemo } from 'react';
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  MeshLambertMaterial,
  NearestFilter,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from 'three';
import { COBBLE_URL, GRASS_URL, type AssetId } from '@/data/assets';
import type { Placement } from '@/data/maps/types';
import { PALETTE } from '@/data/palette';
import { InstancedModel, type Transform } from '@/game/assets/InstancedModel';
import { currentMap } from '@/game/world/current-map';
import { buildRibbon, mergeRibbons, type RibbonMesh } from '@/game/world/ribbon';

const COBBLE_TILE_METERS = 2;
const GRASS_TILE_METERS = 3;
const PLAZA_Y = 0.02;
const ICE_Y = 0.03;
const WATER_Y = 0.04;
const PATH_Y = 0.05;
const GLASS_COLOR = '#c4d6dc';
const GLASS_OPACITY = 0.22;

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

function tiledMaterial(url: string, w: number, d: number, tileMeters: number): MeshLambertMaterial {
  const texture = new TextureLoader().load(url);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(w / tileMeters, d / tileMeters);
  return new MeshLambertMaterial({ map: texture });
}

function TiledGround({
  url,
  tileMeters,
  cx,
  cz,
  w,
  d,
  y,
}: {
  url: string;
  tileMeters: number;
  cx: number;
  cz: number;
  w: number;
  d: number;
  y: number;
}) {
  const material = useMemo(() => tiledMaterial(url, w, d, tileMeters), [url, w, d, tileMeters]);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[cx, y, cz]} material={material}>
      <planeGeometry args={[w, d]} />
    </mesh>
  );
}

function Floors({ map }: { map: typeof currentMap }) {
  return (
    <>
      {(map.floors ?? []).map((f, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[f.cx, f.y ?? 0.03, f.cz]}>
          <planeGeometry args={[f.w, f.d]} />
          <meshLambertMaterial color={f.color} />
        </mesh>
      ))}
    </>
  );
}

function GlassRoofs({ map }: { map: typeof currentMap }) {
  return (
    <>
      {(map.glass ?? []).map((g, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[g.cx, g.y, g.cz]}>
          <planeGeometry args={[g.w, g.d]} />
          <meshLambertMaterial
            color={GLASS_COLOR}
            transparent
            opacity={GLASS_OPACITY}
            depthWrite={false}
            side={DoubleSide}
          />
        </mesh>
      ))}
    </>
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
      <TiledGround
        url={GRASS_URL}
        tileMeters={GRASS_TILE_METERS}
        cx={0}
        cz={0}
        w={400}
        d={400}
        y={0}
      />
      <TiledGround url={COBBLE_URL} tileMeters={COBBLE_TILE_METERS} {...map.plaza} y={PLAZA_Y} />
      {map.paths.length > 0 && <RibbonMeshView data={paths} color={PALETTE.frost} />}
      <RibbonMeshView data={ice} color={PALETTE.slate_light} />
      <RibbonMeshView data={water} color={PALETTE.slate} />
      <Floors map={map} />
      {(map.lights ?? []).map((l, i) => (
        <pointLight
          key={i}
          position={[l.x, l.y, l.z]}
          color={l.color}
          intensity={l.intensity}
          distance={l.distance}
        />
      ))}
      {groups.map(([id, transforms]) => (
        <InstancedModel key={id} id={id} transforms={transforms} />
      ))}
      <GlassRoofs map={map} />
    </>
  );
}
