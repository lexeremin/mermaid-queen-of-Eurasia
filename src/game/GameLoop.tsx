import { useFrame } from '@react-three/fiber';
import { Plane, Raycaster, Vector2, Vector3, type Camera } from 'three';
import { createFixedStepper } from '@/game/fixed-step';
import { MAX_STEPS_PER_FRAME, SIM_STEP, sim } from '@/game/sim';
import { nav } from '@/game/world/nav';
import { clearPressed, getMove, input } from '@/input/input-state';
import { isSimRunning, useGameStore } from '@/store/game-store';
import { currentMap, currentWorld } from '@/game/world/current-map';
import { PLAYER_SPEED, stepPlayer } from '@/systems/movement';
import { findPath, steerAlongPath } from '@/systems/pathfinding';
import { zoneAt } from '@/systems/zones';
import { isZero, type Vec2 } from '@/utils/vec2';

const GROUND = new Plane(new Vector3(0, 1, 0), 0);
const hit = new Vector3();
const ndc = new Vector2();
const raycaster = new Raycaster();
const stepper = createFixedStepper(SIM_STEP, MAX_STEPS_PER_FRAME);
const STUCK_SECONDS = 0.5;
const STUCK_SPEED_FRACTION = 0.25;

function groundPoint(camera: Camera, click: { x: number; y: number }): Vec2 | null {
  ndc.set(click.x, click.y);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.ray.intersectPlane(GROUND, hit) ? { x: hit.x, z: hit.z } : null;
}

export function walkTo(target: Vec2): boolean {
  const path = findPath(nav, sim.curr.pos, target);
  sim.path = path ?? [];
  sim.stuckTime = 0;
  return path !== null;
}

export function GameLoop() {
  useFrame((state, delta) => {
    if (!isSimRunning(useGameStore.getState())) {
      clearPressed(input);
      input.click = null;
      stepper.reset();
      return;
    }

    if (input.click) {
      const target = groundPoint(state.camera, input.click);
      input.click = null;
      if (target) walkTo(target);
    }

    if (sim.path.length > 0 && !isZero(getMove(input))) sim.path = [];

    sim.alpha = stepper.advance(delta, (dt) => {
      let move = getMove(input);
      const walking = isZero(move) && sim.path.length > 0;
      if (walking) {
        const step = steerAlongPath(sim.curr.pos, sim.path);
        sim.path = step.path;
        move = step.move;
      }

      sim.prev = sim.curr;
      sim.curr = stepPlayer(sim.curr, { move }, dt, currentWorld);

      if (walking && sim.path.length > 0) {
        const moved = Math.hypot(sim.curr.pos.x - sim.prev.pos.x, sim.curr.pos.z - sim.prev.pos.z);
        sim.stuckTime = moved < PLAYER_SPEED * dt * STUCK_SPEED_FRACTION ? sim.stuckTime + dt : 0;
        if (sim.stuckTime > STUCK_SECONDS) {
          sim.path = [];
          sim.stuckTime = 0;
        }
      } else {
        sim.stuckTime = 0;
      }
      clearPressed(input);
    });

    const store = useGameStore.getState();
    const zone = zoneAt(currentMap.zones, sim.curr.pos);
    if (zone !== store.zone) store.setZone(zone);
  });

  return null;
}
