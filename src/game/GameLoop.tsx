import { useFrame } from '@react-three/fiber';
import { Plane, Raycaster, Vector2, Vector3, type Camera } from 'three';
import { createFixedStepper } from '@/game/fixed-step';
import { playSfx } from '@/audio/sfx';
import { playAuraSong, stopVoice } from '@/audio/voice';
import { combat } from '@/game/combat-sim';
import { recall, stepRecallChannel, toggleRecall } from '@/game/recall-sim';
import { cancelRecall } from '@/systems/recall';
import { loot, spawnDrops } from '@/game/loot-sim';
import { grantXp } from '@/game/progress-actions';
import { prayAtShrine, stepGather } from '@/game/garden-actions';
import {
  goDeeper,
  goDown,
  goUp,
  onBossDefeated,
  stepChests,
  stepGate,
} from '@/game/dungeon-actions';
import { activeLevel } from '@/game/dungeon-sim';
import { METRO } from '@/data/maps/red-square';
import { onEnemyDefeatedForQuests } from '@/game/quest-actions';
import { currentStats, useProgressStore } from '@/store/progress-store';
import { useToastStore } from '@/store/toast-store';
import { ITEMS } from '@/data/items';
import { XP_REWARDS } from '@/systems/progression';
import { cameraRef } from '@/game/camera-ref';
import { shakeScreen, showDamage, stepFeedback } from '@/game/feedback';
import { BIG_HIT } from '@/systems/floating-numbers';
import { traumaForHurt } from '@/systems/shake';
import { useSettingsStore } from '@/store/settings-store';
import { canTake } from '@/systems/inventory';
import { stepPickups } from '@/systems/pickups';
import { MAX_STEPS_PER_FRAME, SIM_STEP, sim } from '@/game/sim';
import { track } from '@/net/stats';
import { requestSave } from '@/save/save-requests';
import { useCombatStore } from '@/store/combat-store';
import { BOSS_LINES, ENEMIES, isBossKind } from '@/data/enemies';
import { stepCombat, type CombatEvent } from '@/systems/combat';
import { BLINK, MERMAID } from '@/systems/abilities';
import { pickBlinkDestination } from '@/systems/blink';
import { isInWater } from '@/systems/water';
import { stepWater, toggleForm } from '@/game/form-sim';
import { nav } from '@/game/world/nav';
import {
  clearPressed,
  consumePressed,
  getMove,
  input,
  setHeld,
  staleInput,
} from '@/input/input-state';
import { useDialogueStore } from '@/store/dialogue-store';
import { useNpcStore } from '@/store/npc-store';
import { useDungeonStore } from '@/store/dungeon-store';
import { xpMult } from '@/systems/enemy-ai';
import { isSimRunning, useGameStore, type PlaceId } from '@/store/game-store';
import { currentMap, currentWorld } from '@/game/world/current-map';
import { PLAYER_SPEED, stepPlayer } from '@/systems/movement';
import { findPath, steerAlongPath } from '@/systems/pathfinding';
import { isUnderground } from '@/data/maps/underground';
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
const SPOTS = [...currentMap.npcs, ...(currentMap.archangels ?? []), ...(currentMap.locals ?? [])];
const PLACE_OF_ASSET = new Map<string, PlaceId>([
  ['questBoard', 'board'],
  ['shrine', 'shrine'],
]);
/** Things Rosa can walk up to and use: the notice board and the Pearl Shrine. */
const PLACES: { id: PlaceId; x: number; z: number }[] = [
  ...currentMap.placements.flatMap((p) => {
    const id = PLACE_OF_ASSET.get(p.asset);
    return id ? [{ id, x: p.x, z: p.z }] : [];
  }),
  // The metro pavilion on Manezhnaya Square.
  { id: 'metro-down', x: METRO.door.x, z: METRO.door.z },
];

/** Underground, the stairs of the current layer replace the surface places. */
function activePlaces(): { id: PlaceId; x: number; z: number }[] {
  const level = activeLevel();
  if (!level || !isUnderground(sim.curr.pos)) return PLACES;
  return [
    { id: 'metro-up', x: level.stairsUp.x, z: level.stairsUp.z - 2.4 },
    { id: 'stairs-down', x: level.stairsDown.x, z: level.stairsDown.z + 2.4 },
  ];
}

export function visitPlace(id: string): void {
  cancelRecall(recall);
  if (id === 'board') useGameStore.getState().openQuestPanel('board');
  else if (id === 'shrine') prayAtShrine();
  else if (id === 'metro-down') {
    // Once she has been deeper than the first layer the metro door asks where to.
    if (useDungeonStore.getState().deepest > 1) useGameStore.getState().openQuestPanel('depth');
    else goDown();
  } else if (id === 'metro-up') goUp();
  else if (id === 'stairs-down') goDeeper();
}
const NPC_TARGETS = currentMap.npcs.map((n) => ({ id: n.id, pos: { x: n.x, z: n.z } }));
const STUCK_SPEED_FRACTION = 0.25;

function groundPoint(camera: Camera, click: { x: number; y: number }): Vec2 | null {
  ndc.set(click.x, click.y);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.ray.intersectPlane(GROUND, hit) ? { x: hit.x, z: hit.z } : null;
}

/** Where the blink is aimed: the mouse cursor on the ground, else the way Rosa is moving or facing. */
let aimPoint: Vec2 | null = null;

function resolveBlink(from: Vec2, move: Vec2): Vec2 | null {
  const aim =
    aimPoint ??
    (() => {
      const dir = isZero(move) ? sim.curr.facing : move;
      const len = Math.hypot(dir.x, dir.z) || 1;
      return {
        x: from.x + (dir.x / len) * BLINK.range,
        z: from.z + (dir.z / len) * BLINK.range,
      };
    })();
  return pickBlinkDestination(from, aim, BLINK.range, currentWorld, (to) =>
    nav.sameRegion(from, to),
  );
}

/** The mermaid is slower on land and faster in the water; a human is the same everywhere. */
function speedMultiplier(): number {
  if (useGameStore.getState().form !== 'mermaid') return 1;
  return isInWater(currentWorld.water, sim.curr.pos) ? MERMAID.swimSpeed : MERMAID.landSpeed;
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
  playSfx('loot');
  requestSave();
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
  if (events.length > 0) requestSave();
  for (const event of events) {
    if (event.type === 'enemyDefeated') {
      track('enemy_defeated', { kind: event.kind });
      grantXp(
        Math.round(XP_REWARDS.enemy[event.kind] * xpMult(event.power)),
        ENEMIES[event.kind].name,
      );
      onEnemyDefeatedForQuests(event.kind);
      spawnDrops(event.kind, { x: event.x, z: event.z });
      shakeScreen(0.06);
      if (isBossKind(event.kind)) {
        playSfx('bossDown');
        shakeScreen(0.8);
        onBossDefeated({ x: event.x, z: event.z }, event.kind);
      }
    } else if (event.type === 'bossPhase') {
      playSfx('bossRoar');
      shakeScreen(0.6);
      useToastStore
        .getState()
        .push(
          event.phase === 2
            ? (BOSS_LINES[event.kind]?.angry ?? 'The boss calls for backup!')
            : (BOSS_LINES[event.kind]?.furious ?? 'The boss is furious!'),
          'warn',
        );
    } else if (event.type === 'bossSummon') {
      playSfx('hit');
    } else if (event.type === 'cast') {
      if (event.ability === 'attack') playSfx('swing');
      else if (event.ability === 'spell') playSfx('wave');
      else if (event.ability === 'aura') playAuraSong();
      else if (event.ability === 'blink') playSfx('blink');
    } else if (event.type === 'enemyHit') {
      playSfx('hit');
      showDamage(event.x, event.z, event.amount, 'enemy');
      if (event.amount >= BIG_HIT) playSfx('crit');
    } else if (event.type === 'playerHurt') {
      playSfx('hurt');
      showDamage(sim.curr.pos.x, sim.curr.pos.z, event.damage, 'player');
      shakeScreen(traumaForHurt(event.damage));
    } else if (event.type === 'playerDowned') {
      stopVoice();
      playSfx('downed');
      shakeScreen(0.4);
      useGameStore.getState().setDowned(true);
      track('player_downed');
    }
  }
}

export function GameLoop() {
  useFrame((state, delta) => {
    cameraRef.camera = state.camera;
    if (import.meta.env.DEV) (window as { __mqCamera?: Camera }).__mqCamera = state.camera;
    const stale = staleInput(input, performance.now());
    if (stale.stick) input.stickMove = { x: 0, z: 0 };
    if (stale.attack) setHeld(input, 'attack', false);
    if (!isSimRunning(useGameStore.getState())) {
      clearPressed(input);
      input.click = null;
      stepper.reset();
      return;
    }

    stepFeedback(delta, useSettingsStore.getState().weather && !isUnderground(sim.curr.pos));

    const followingId =
      Object.entries(useNpcStore.getState().npcs).find(([, n]) => n.following)?.[0] ?? null;
    const spots = followingId ? SPOTS.filter((n) => n.id !== followingId) : SPOTS;
    const talkNow = consumePressed(input, 'interact');
    if (talkNow) {
      const near = nearestTalkable(spots, sim.curr.pos);
      if (near) {
        sim.path = [];
        sim.talkTo = null;
        useDialogueStore.getState().open(near.id);
        return;
      }
      const place = nearestTalkable(activePlaces(), sim.curr.pos);
      if (place) {
        sim.path = [];
        sim.talkTo = null;
        visitPlace(place.id);
        return;
      }
    }

    if (consumePressed(input, 'form')) {
      if (recall.active) cancelRecall(recall);
      toggleForm();
    }

    if (consumePressed(input, 'recall')) {
      if (!recall.active) {
        sim.path = [];
        sim.talkTo = null;
      }
      toggleRecall(!combat.downed);
    }

    if (input.click) {
      const click = input.click;
      input.click = null;
      const target = groundPoint(state.camera, click);
      const ray = raycaster.ray;
      const bodyHit = npcUnderRay(spots, {
        origin: { x: ray.origin.x, y: ray.origin.y, z: ray.origin.z },
        dir: { x: ray.direction.x, y: ray.direction.y, z: ray.direction.z },
      });
      if (target) {
        const npc = bodyHit ?? npcAtPoint(spots, target);
        if (npc) {
          if (Math.hypot(npc.x - sim.curr.pos.x, npc.z - sim.curr.pos.z) <= TALK_RANGE) {
            sim.path = [];
            sim.talkTo = null;
            useDialogueStore.getState().open(npc.id);
            return;
          }
          sim.talkTo = npc.id;
          walkTo(approachPoint(npc, sim.curr.pos));
        } else if (npcAtPoint(activePlaces(), target)) {
          const place = npcAtPoint(activePlaces(), target);
          if (
            place &&
            Math.hypot(place.x - sim.curr.pos.x, place.z - sim.curr.pos.z) <= TALK_RANGE
          ) {
            sim.path = [];
            sim.talkTo = null;
            visitPlace(place.id);
            return;
          }
          if (place) {
            sim.talkTo = place.id;
            walkTo(approachPoint(place, sim.curr.pos));
          }
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

    aimPoint = input.pointer ? groundPoint(state.camera, input.pointer) : null;
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
          aura: input.pressed.aura,
          spell: input.pressed.spell,
          blink: input.pressed.blink,
        },
        resolveBlink: (from) => resolveBlink(from, move),
        npcs: followingId ? NPC_TARGETS.filter((n) => n.id !== followingId) : NPC_TARGETS,
        world: currentWorld,
        arena: activeLevel()?.arena ?? null,
        form: useGameStore.getState().form,
        stats,
        companion: followingId ? { id: followingId } : null,
      });
      if (frame.blinkTo) {
        const pos = frame.blinkTo;
        sim.prev = { ...sim.curr, pos };
        sim.curr = { ...sim.curr, pos };
        sim.path = [];
        sim.talkTo = null;
      }
      if (frame.cancelWalk) {
        sim.path = [];
        sim.talkTo = null;
      }
      handleCombatEvents(frame.events);
      stepRecallChannel(dt, {
        moving: !isZero(move) || sim.path.length > 0,
        acting:
          input.held.attack ||
          input.pressed.blink ||
          input.pressed.aura ||
          input.pressed.spell ||
          frame.blinkTo !== null,
        hurt: frame.events.some((e) => e.type === 'playerHurt'),
        downed: combat.downed,
      });

      const walking = isZero(move) && sim.path.length > 0;
      if (walking) {
        const step = steerAlongPath(sim.curr.pos, sim.path);
        sim.path = step.path;
        move = step.move;
      }
      if (frame.moveScale !== 1)
        move = { x: move.x * frame.moveScale, z: move.z * frame.moveScale };

      sim.prev = sim.curr;
      sim.curr = stepPlayer(sim.curr, { move }, dt, currentWorld, speedMultiplier());
      stepWater(isInWater(currentWorld.water, sim.curr.pos), dt);
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
      stepGather(dt, sim.curr.pos);
      stepChests(sim.curr.pos);
      stepGate(sim.curr.pos);
      const picked = stepPickups(loot.pickups, sim.curr.pos, dt, tryCollect, (item) =>
        canTake(useProgressStore.getState(), item),
      );
      loot.pickups = picked.pickups;
      if (picked.blocked.length > 0) warnBagFull();
      clearPressed(input);
    });

    useCombatStore.getState().set(combat.hp, combat.mana);

    const store = useGameStore.getState();
    const below = isUnderground(sim.curr.pos);
    const zone = zoneAt(below ? (activeLevel()?.zones ?? []) : currentMap.zones, sim.curr.pos);
    if (zone !== store.zone) store.setZone(zone);

    if (below !== store.underground) store.setUnderground(below);

    const near = nearestTalkable(spots, sim.curr.pos);
    const nearId = near?.id ?? null;
    if (nearId !== store.nearbyNpc) store.setNearbyNpc(nearId);

    const nearPlace = (nearestTalkable(activePlaces(), sim.curr.pos)?.id ?? null) as PlaceId | null;
    if (nearPlace !== store.nearPlace) store.setNearPlace(nearPlace);

    if (sim.talkTo && sim.path.length === 0) {
      const target = spots.find((n) => n.id === sim.talkTo);
      const wanted = sim.talkTo;
      sim.talkTo = null;
      if (target && nearId === target.id) useDialogueStore.getState().open(target.id);
      else if (!target && nearPlace === wanted) visitPlace(wanted);
    }
  });

  return null;
}
