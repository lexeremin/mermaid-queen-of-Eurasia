import { useFrame } from '@react-three/fiber';
import { Plane, Vector3 } from 'three';
import { createFixedStepper } from '@/game/fixed-step';
import { MAX_STEPS_PER_FRAME, SIM_STEP, sim } from '@/game/sim';
import { clearPressed, getMove, input } from '@/input/input-state';
import { isSimRunning, useGameStore } from '@/store/game-store';
import { currentMap, currentWorld } from '@/game/world/current-map';
import { stepPlayer } from '@/systems/movement';
import { zoneAt } from '@/systems/zones';
import { normalize } from '@/utils/vec2';

const GROUND = new Plane(new Vector3(0, 1, 0), 0);
const hit = new Vector3();
const stepper = createFixedStepper(SIM_STEP, MAX_STEPS_PER_FRAME);

export function GameLoop() {
  useFrame((state, delta) => {
    if (!isSimRunning(useGameStore.getState())) {
      clearPressed(input);
      stepper.reset();
      return;
    }

    if (input.pointerActive) {
      state.raycaster.setFromCamera(state.pointer, state.camera);
      if (state.raycaster.ray.intersectPlane(GROUND, hit)) {
        input.aim = normalize({ x: hit.x - sim.curr.pos.x, z: hit.z - sim.curr.pos.z });
      }
    }

    sim.alpha = stepper.advance(delta, (dt) => {
      sim.prev = sim.curr;
      sim.curr = stepPlayer(sim.curr, { move: getMove(input), aim: input.aim }, dt, currentWorld);
      clearPressed(input);
    });

    const store = useGameStore.getState();
    const zone = zoneAt(currentMap.zones, sim.curr.pos);
    if (zone !== store.zone) store.setZone(zone);
  });

  return null;
}
