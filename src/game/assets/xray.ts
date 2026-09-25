import {
  AlwaysStencilFunc,
  GreaterDepth,
  KeepStencilOp,
  Mesh,
  MeshBasicMaterial,
  NotEqualStencilFunc,
  ReplaceStencilOp,
  type Material,
  type MeshLambertMaterial,
  type Object3D,
} from 'three';
import { getRetroMaterial } from '@/game/assets/retro-material';

const HERO_STENCIL = 1;

let hero: MeshLambertMaterial | undefined;
let xray: MeshBasicMaterial | undefined;

/** Retro material for the hero: its visible pixels mark the stencil buffer. */
export function getHeroMaterial(): MeshLambertMaterial {
  if (!hero) {
    hero = getRetroMaterial().clone();
    hero.stencilWrite = true;
    hero.stencilRef = HERO_STENCIL;
    hero.stencilFunc = AlwaysStencilFunc;
    hero.stencilZPass = ReplaceStencilOp;
  }
  return hero;
}

/** Draws only where the hero is hidden behind something, so she shows through roofs and walls. */
function getXrayMaterial(): Material {
  if (!xray) {
    xray = new MeshBasicMaterial({
      color: '#ff9fb8',
      transparent: true,
      opacity: 0.55,
      depthFunc: GreaterDepth,
      depthWrite: false,
      stencilWrite: true,
      stencilRef: HERO_STENCIL,
      stencilFunc: NotEqualStencilFunc,
      stencilFail: KeepStencilOp,
      stencilZFail: KeepStencilOp,
      stencilZPass: KeepStencilOp,
    });
  }
  return xray;
}

const twins: Mesh[] = [];
let twinsShown = true;

/** Shows or hides every X-ray twin (they cost a draw call each), driven by `heroOcclusion`. */
export function setXrayVisible(visible: boolean): void {
  if (visible === twinsShown) return;
  twinsShown = visible;
  for (let i = twins.length - 1; i >= 0; i--) {
    const twin = twins[i];
    if (!twin?.parent) twins.splice(i, 1);
    else twin.visible = visible;
  }
}

/** Applies the hero material and adds an X-ray twin under every mesh so it follows the same animation. */
export function applyHeroLook(root: Object3D): void {
  const material = getHeroMaterial();
  const twinMaterial = getXrayMaterial();
  const meshes: Mesh[] = [];
  root.traverse((child) => {
    if ('isMesh' in child && child.isMesh && !child.userData.xray) meshes.push(child as Mesh);
  });
  for (const mesh of meshes) {
    mesh.material = material;
    const twin = new Mesh(mesh.geometry, twinMaterial);
    twin.userData.xray = true;
    twin.renderOrder = 10;
    twin.visible = twinsShown;
    twins.push(twin);
    mesh.add(twin);
  }
}
