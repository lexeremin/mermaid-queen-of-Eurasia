import { useFrame } from '@react-three/fiber';
import { Plane, Raycaster, Vector2, Vector3, type Camera } from 'three';
import { createFixedStepper } from '@/game/fixed-step';
import { combat } from '@/game/combat-sim';
import { loot, spawnDrops } from '@/game/loot-sim';
import { grantXp } from '@/game/progress-actions';
import { currentStats, useProgressStore } from '@/store/progress-store';
import { useToastStore } from '@/store/toast-store';
import { ITEMS } from '@/data/items';
import { XP_REWARDS } from '@/systems/progression';
import { stepPickups } from '@/systems/pickups';
import { MAX_STEPS_PER_FRAME, SIM_STEP, sim } from '@/game/sim';
import { track } from '@/net/stats';
import { useCombatStore } from '@/store/combat-store';
import { ENEMIES } from '@/data/enemies';
import { stepCombat, type CombatEvent } from '@/systems/combat';
import { nav } from '@/game/world/nav';
import { clearPressed, consumePressed, getMove, input } from '@/input/input-state';
import { useDialogueStore } from '@/store/dialogue-store';
import { isSimRunning, useGameStore } from '@/store/game-store';
import { currentMap, currentWorld } from '@/game/world/current-map';
import { PLAYER_SPEED, stepPlayer } from '@/systems/movement';
import { findPath, steerAlongPath } from '@/systems/pathfinding';
import { zoneAt } from '@/systems/zones';
import {
  approachPoint,
  nearestTalkable,
  npcAtPoint,
  npcUnderRay,
  TALK_RANGE,
} from '@/systems/interaction';
import { isZero, type Vec2 } from '@/utils/vec2';

const GROUND = new Plane(new Vector3(0, 1, 0), 0);
const hit = new Vector3();
const ndc = new Vector2();
const raycaster = new Raycaster();
const stepper = createFixedStepper(SIM_STEP, MAX_STEPS_PER_FRAME);
const STUCK_SECONDS = 0.5;
const SPOTS = currentMap.npcs;
const NPC_TARGETS = currentMap.npcs.map((n) => ({ id: n.id, pos: { x: n.x, z: n.z } }));
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

function tryCollect(item: (typeof ITEMS)[keyof typeof ITEMS]['id']): boolean {
  const result = useProgressStore.getState().addItem(item);
  if (result.added === 0) return false;
  useToastStore.getState().push(`Picked up ${ITEMS[item].name}`, 'item');
  return true;
}

let lastBagWarning = 0;
function warnBagFull(): void {
  const now = performance.now();
  if (now - lastBagWarning < 3000) return;
  lastBagWarning = now;
  useToastStore.getState().push('Bag full', 'warn');
}

function handleCombatEvents(events: readonly CombatEvent[]): void {
  for (const event of events) {
    if (event.type === 'enemyDefeated') {
      track('enemy_defeated', { kind: event.kind });
      grantXp(XP_REWARDS.enemy[event.kind], ENEMIES[event.kind].name);
      spawnDrops(event.kind, { x: event.x, z: event.z });
    } else if (event.type === 'playerDowned') {
      useGameStore.getState().setDowned(true);
      track('player_downed');
    }
  }
}

export function GameLoop() {
  useFrame((state, delta) => {
    if (import.meta.env.DEV) (window as { __mqCamera?: Camera }).__mqCamera = state.camera;
    if (!isSimRunning(useGameStore.getState())) {
      clearPressed(input);
      input.click = null;
      stepper.reset();
      return;
    }

    const talkNow = consumePressed(input, 'interact');
    if (talkNow) {
      const near = nearestTalkable(SPOTS, sim.curr.pos);
      if (near) {
        sim.path = [];
        sim.talkTo = null;
        useDialogueStore.getState().open(near.id);
        return;
      }
    }

    if (input.click) {
      const click = input.click;
      input.click = null;
      const target = groundPoint(state.camera, click);
      const ray = raycaster.ray;
      const bodyHit = npcUnderRay(SPOTS, {
        origin: { x: ray.origin.x, y: ray.origin.y, z: ray.origin.z },
        dir: { x: ray.direction.x, y: ray.direction.y, z: ray.direction.z },
      });
      if (target) {
        const npc = bodyHit ?? npcAtPoint(SPOTS, target);
        if (npc) {
          if (Math.hypot(npc.x - sim.curr.pos.x, npc.z - sim.curr.pos.z) <= TALK_RANGE) {
            sim.path = [];
            sim.talkTo = null;
            useDialogueStore.getState().open(npc.id);
            return;
          }
          sim.talkTo = npc.id;
          walkTo(approachPoint(npc, sim.curr.pos));
        } else if (!click.touch) {
          sim.talkTo = null;
          walkTo(target);
        }
      }
    }

    if (sim.path.length > 0 && !isZero(getMove(input))) {
      sim.path = [];
      sim.talkTo = null;
    }

    const stats = currentStats();
    sim.alpha = stepper.advance(delta, (dt) => {
      let move = getMove(input);
      const frame = stepCombat(combat, {
        dt,
        playerPos: sim.curr.pos,
        playerFacing: sim.curr.facing,
        move,
        actions: {
          attack: input.held.attack || input.pressed.attack,
          dash: input.pressed.dash,
          aura: input.pressed.aura,
          spell: input.pressed.spell,
        },
        npcs: NPC_TARGETS,
        world: currentWorld,
        stats,
      });
      if (frame.cancelWalk) {
        sim.path = [];
        sim.talkTo = null;
      }
      handleCombatEvents(frame.events);

      const walking = isZero(move) && sim.path.length > 0 && !frame.moveOverride;
      if (walking) {
        const step = steerAlongPath(sim.curr.pos, sim.path);
        sim.path = step.path;
        move = step.move;
      }
      if (frame.moveOverride) move = frame.moveOverride;
      else if (frame.moveScale !== 1)
        move = { x: move.x * frame.moveScale, z: move.z * frame.moveScale };

      sim.prev = sim.curr;
      sim.curr = stepPlayer(sim.curr, { move }, dt, currentWorld);
      if (frame.faceOverride) sim.curr = { ...sim.curr, facing: frame.faceOverride };

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
      const picked = stepPickups(loot.pickups, sim.curr.pos, dt, tryCollect);
      loot.pickups = picked.pickups;
      if (picked.blocked.length > 0) warnBagFull();
      clearPressed(input);
    });

    useCombatStore.getState().set(combat.hp, combat.mana);

    const store = useGameStore.getState();
    const zone = zoneAt(currentMap.zones, sim.curr.pos);
    if (zone !== store.zone) store.setZone(zone);

    const near = nearestTalkable(SPOTS, sim.curr.pos);
    const nearId = near?.id ?? null;
    if (nearId !== store.nearbyNpc) store.setNearbyNpc(nearId);

    if (sim.talkTo && sim.path.length === 0) {
      const target = SPOTS.find((n) => n.id === sim.talkTo);
      sim.talkTo = null;
      if (target && nearId === target.id) useDialogueStore.getState().open(target.id);
    }
  });

  return null;
}
