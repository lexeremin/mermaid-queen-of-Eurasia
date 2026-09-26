import { useMemo } from 'react';
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  LinearFilter,
  LinearMipmapLinearFilter,
  MeshLambertMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from 'three';
import { GRASS_URL, type AssetId } from '@/data/assets';
import type { Placement } from '@/data/maps/types';
import { PALETTE } from '@/data/palette';
import { InstancedModel, type Transform } from '@/game/assets/InstancedModel';
import { useDispose } from '@/game/assets/use-dispose';
import { useLoadingState } from '@/game/loading-state';
import { useGameStore } from '@/store/game-store';
import { GroundPaving } from '@/game/world/GroundPaving';
import { EntranceGlow } from '@/game/world/EntranceGlow';
import { LampGlow } from '@/game/world/LampGlow';
import { ContactShadows } from '@/game/world/ContactShadows';
import { layerLevel } from '@/data/maps/underground';
import { useDungeonStore } from '@/store/dungeon-store';
import { currentMap } from '@/game/world/current-map';
import { buildRibbon, mergeRibbons, type RibbonMesh } from '@/game/world/ribbon';

/** 64 px tiles at 16 px per metre (cobble) and about 11 px per metre (grass). */
const GRASS_TILE_METERS = 6;
const GROUND_ANISOTROPY = 8;
const ICE_Y = 0.03;
const WATER_Y = 0.04;
const PATH_Y = 0.05;
/** Overhead parts of the GUM gallery that hide while Rosa is inside, so they never block the camera. */
/** The park just north of the GUM gallery: from there the gallery's roof would hang in front of the picture. */
const ZARYADYE_ZONES: ReadonlySet<string> = new Set(['zaryadye', 'amphitheatre', 'chapel']);
const ROOF_STRUCTURE: ReadonlySet<AssetId> = new Set(['gumRibs', 'gumBridge']);
const GLASS_COLOR = '#c4d6dc';
const GRAVEL_COLOR = '#8f8672';
const GLASS_OPACITY = 0.22;

function groupByAsset(placements: readonly Placement[]): [AssetId, Transform[]][] {
  const groups = new Map<AssetId, Transform[]>();
  for (const p of placements) {
    const list = groups.get(p.asset) ?? [];
    list.push({ x: p.x, z: p.z, rotY: p.rotY, scale: p.scale, stretch: p.stretch });
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
  useDispose(geometry);
  useDispose(material);
  return <mesh geometry={geometry} material={material} />;
}

function tiledMaterial(url: string, w: number, d: number, tileMeters: number): MeshLambertMaterial {
  const texture = new TextureLoader().load(url);
  texture.colorSpace = SRGBColorSpace;
  // Trilinear and anisotropic. Nearest magnification made the grout lines swim (1 px, then 2 px thick) as the
  // camera moved forward and back; smooth filtering keeps their thickness steady.
  texture.magFilter = LinearFilter;
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
  const disposer = useMemo(
    () => ({
      dispose: () => {
        material.map?.dispose();
        material.dispose();
      },
    }),
    [material],
  );
  useDispose(disposer);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[cx, y, cz]} material={material}>
      <planeGeometry args={[w, d]} />
    </mesh>
  );
}

/** All the flat coloured floors of one group merged into a single mesh (one draw call, colours per vertex). */
function Floors({ floors }: { floors: NonNullable<typeof currentMap.floors> }) {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    const color = new Color();
    for (const f of floors) {
      const base = positions.length / 3;
      const y = f.y ?? 0.03;
      const x0 = f.cx - f.w / 2;
      const x1 = f.cx + f.w / 2;
      const z0 = f.cz - f.d / 2;
      const z1 = f.cz + f.d / 2;
      positions.push(x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1);
      color.set(f.color);
      for (let k = 0; k < 4; k++) colors.push(color.r, color.g, color.b);
      indices.push(base, base + 3, base + 2, base, base + 2, base + 1);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(positions, 3));
    g.setAttribute('color', new Float32BufferAttribute(colors, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [floors]);
  useDispose(geometry);
  if (floors.length === 0) return null;
  return (
    <mesh geometry={geometry}>
      <meshLambertMaterial vertexColors />
    </mesh>
  );
}

function GlassRoofs({ map, hidden }: { map: typeof currentMap; hidden: boolean }) {
  if (hidden) return null;
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
  const inZaryadye = useGameStore((s) => ZARYADYE_ZONES.has(s.zone?.id ?? ''));
  const inGum = useGameStore((s) => s.zone?.id === 'gum') || inZaryadye;
  const inUnderground = useGameStore((s) => s.underground);
  const warming = useLoadingState((s) => s.warmUnderground);
  const underground = inUnderground || warming;
  const layer = useDungeonStore((s) => s.layer);
  // While the loading screen is up the first layer is drawn once, so its shaders are compiled before Rosa descends.
  const level = useMemo(
    () => (layer > 0 ? layerLevel(layer) : warming ? layerLevel(1) : null),
    [layer, warming],
  );
  const undergroundGroups = useMemo(() => (level ? groupByAsset(level.placements) : []), [level]);
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
      <GroundPaving />
      {map.paths.length > 0 && <RibbonMeshView data={paths} color={GRAVEL_COLOR} />}
      <RibbonMeshView data={ice} color={PALETTE.slate_light} />
      <RibbonMeshView data={water} color={PALETTE.slate} />
      <Floors floors={map.floors ?? []} />
      {underground && level && <Floors key={`floors-${layer}`} floors={level.floors} />}
      {[...(map.lights ?? []), ...(underground && level ? level.lights : [])].map((l, i) => (
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
      {underground &&
        undergroundGroups.map(([id, transforms]) => (
          <InstancedModel key={`${layer}-${id}`} id={id} transforms={transforms} />
        ))}
      <ContactShadows />
      <EntranceGlow />
      <LampGlow />
      <GlassRoofs map={map} hidden={inZaryadye} />
    </>
  );
}
