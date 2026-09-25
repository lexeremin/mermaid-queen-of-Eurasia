import { useMemo } from 'react';
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  LinearMipmapLinearFilter,
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
import { useGameStore } from '@/store/game-store';
import { EntranceGlow } from '@/game/world/EntranceGlow';
import { ContactShadows } from '@/game/world/ContactShadows';
import { currentMap } from '@/game/world/current-map';
import { buildRibbon, mergeRibbons, type RibbonMesh } from '@/game/world/ribbon';

/** 64 px tiles at 16 px per metre (cobble) and about 11 px per metre (grass). */
const COBBLE_TILE_METERS = 4;
const GRASS_TILE_METERS = 6;
const KERB_COLOR = '#8f97a3';
const KERB_WIDTH = 0.35;
const KERB_Y = 0.012;
const GROUND_ANISOTROPY = 8;
const PLAZA_Y = 0.02;
const ICE_Y = 0.03;
const WATER_Y = 0.04;
const PATH_Y = 0.05;
/** Overhead parts of the GUM gallery that hide while Rosa is inside, so they never block the camera. */
const ROOF_STRUCTURE: ReadonlySet<AssetId> = new Set(['gumRibs', 'gumBridge']);
const GLASS_COLOR = '#c4d6dc';
const GRAVEL_COLOR = '#8f8672';
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
  // Pixel-crisp up close, mipmapped and anisotropic at a distance so the fine tiles do not shimmer.
  texture.magFilter = NearestFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = GROUND_ANISOTROPY;
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
  const inGum = useGameStore((s) => s.zone?.id === 'gum');
  const ice = useMemo(
    () => mergeRibbons(map.waters.map((w) => buildRibbon(w.ribbon.points, w.edgeWidth, ICE_Y))),
    [map],
  );
  const water = useMemo(
    () =>
      mergeRibbons(map.waters.map((w) => buildRibbon(w.ribbon.points, w.ribbon.width, WATER_Y))),
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
      {map.plazas.map((plaza, i) => (
        <mesh key={`kerb${i}`} rotation-x={-Math.PI / 2} position={[plaza.cx, KERB_Y, plaza.cz]}>
          <planeGeometry args={[plaza.w + KERB_WIDTH * 2, plaza.d + KERB_WIDTH * 2]} />
          <meshLambertMaterial color={KERB_COLOR} />
        </mesh>
      ))}
      {map.plazas.map((plaza, i) => (
        <TiledGround
          key={i}
          url={COBBLE_URL}
          tileMeters={COBBLE_TILE_METERS}
          {...plaza}
          y={PLAZA_Y}
        />
      ))}
      {map.paths.length > 0 && <RibbonMeshView data={paths} color={GRAVEL_COLOR} />}
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
        <group key={id} visible={!(inGum && ROOF_STRUCTURE.has(id))}>
          <InstancedModel id={id} transforms={transforms} />
        </group>
      ))}
      <ContactShadows />
      <EntranceGlow />
      <GlassRoofs map={map} />
    </>
  );
}
