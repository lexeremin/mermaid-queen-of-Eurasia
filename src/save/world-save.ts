import { ENEMIES } from '@/data/enemies';
import { combat } from '@/game/combat-sim';
import { gather } from '@/game/gather-sim';
import { loot } from '@/game/loot-sim';
import { syncDungeonWorld } from '@/game/dungeon-sim';
import type { SavedEnemy, SavedWorld } from '@/save/save-data';
import { useDungeonStore } from '@/store/dungeon-store';
import { useGameStore } from '@/store/game-store';
import { currentStats } from '@/store/progress-store';
import { ABILITIES, type AbilityId } from '@/systems/abilities';

const MOVED = 0.5;

/** What differs from a fresh world: hurt, dead, woken or displaced enemies, vitals, cooldowns, loot, herbs, the gate. */
export function collectWorld(): SavedWorld {
  const enemies: Record<string, SavedEnemy> = {};
  for (const e of combat.enemies) {
    const dead = e.state === 'dead';
    const woken = e.helper && !e.dormant;
    const hurt = e.hp < ENEMIES[e.kind].maxHp - 0.01;
    const moved = Math.hypot(e.pos.x - e.spawn.x, e.pos.z - e.spawn.z) > MOVED;
    if (!dead && !woken && !hurt && !moved) continue;
    enemies[e.id] = {
      hp: e.hp,
      dead,
      deadFor: e.deadFor,
      dormant: e.dormant,
      x: e.pos.x,
      z: e.pos.z,
    };
  }
  const cooldowns: Record<string, number> = {};
  for (const id of Object.keys(ABILITIES) as AbilityId[]) {
    if (combat.cooldowns[id] > 0) cooldowns[id] = combat.cooldowns[id];
  }
  const herbs: Record<string, number> = {};
  for (const node of gather.nodes) {
    if (node.kind !== 'pearl' && node.readyAt > gather.time)
      herbs[node.id] = node.readyAt - gather.time;
  }
  return {
    hp: combat.hp,
    mana: combat.mana,
    downed: combat.downed,
    cooldowns,
    enemies,
    gateOpen: useDungeonStore.getState().gateOpen,
    pickups: loot.pickups.map((p) => ({ item: p.item, x: p.pos.x, z: p.pos.z, age: p.age })),
    herbs,
  };
}

/** Puts a saved world back. Dead mobs keep their respawn timers; living ones come back calm where they were. */
export function applyWorld(world: SavedWorld): void {
  const byId = new Map(combat.enemies.map((e) => [e.id, e]));
  for (const [id, s] of Object.entries(world.enemies)) {
    const e = byId.get(id);
    if (!e) continue;
    e.pos = { x: s.x, z: s.z };
    e.dormant = s.dormant;
    if (s.dead) {
      e.hp = 0;
      e.state = 'dead';
      e.deadFor = s.deadFor;
    } else {
      e.hp = Math.max(1, s.hp);
      e.state = 'idle';
    }
  }

  const stats = currentStats();
  combat.hp = world.downed ? 0 : Math.min(world.hp, stats.maxHp);
  combat.mana = Math.min(world.mana, stats.maxMana);
  combat.downed = world.downed;
  useGameStore.getState().setDowned(world.downed);
  for (const id of Object.keys(ABILITIES) as AbilityId[]) {
    combat.cooldowns[id] = world.cooldowns[id] ?? 0;
  }

  loot.pickups = world.pickups.map((p) => ({
    id: loot.nextId++,
    item: p.item,
    pos: { x: p.x, z: p.z },
    age: p.age,
    collectAfter: 0,
  }));
  for (const node of gather.nodes) {
    const left = world.herbs[node.id];
    if (left && node.kind !== 'pearl') node.readyAt = gather.time + left;
  }

  const dungeon = useDungeonStore.getState();
  useDungeonStore.setState({ gateOpen: world.gateOpen || dungeon.bossDefeated });
  syncDungeonWorld();
}
