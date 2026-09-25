import { useEffect, useRef } from 'react';
import { ENEMIES, isBossKind } from '@/data/enemies';
import { maxHpOf } from '@/systems/enemy-ai';
import { bossTuning } from '@/systems/boss';
import { combat, reviveAtSpawn } from '@/game/combat-sim';
import { useCombatStore } from '@/store/combat-store';
import { useGameStore } from '@/store/game-store';
import { useProgressStore, selectStats } from '@/store/progress-store';
import { xpToNext, MAX_LEVEL } from '@/systems/progression';
import { ABILITIES, cooldownFraction, type AbilityId } from '@/systems/abilities';
import { UNLOCK_LEVEL, isUnlocked } from '@/systems/skills';
import { AbilityIcon } from '@/ui/icons';
import { QuestTracker } from '@/ui/QuestTracker';
import { addHudTask } from '@/ui/hud-ticker';
import { Toasts } from '@/ui/Toasts';

const SLOTS: { id: AbilityId; key: string; label: string }[] = [
  { id: 'attack', key: 'Space', label: 'Trident' },
  { id: 'blink', key: 'Shift', label: 'Blink' },
  { id: 'aura', key: 'Q', label: 'Aura' },
  { id: 'spell', key: 'R', label: 'Surge' },
];

/** Longer cooldowns also show the seconds left; the quick trident swing only shows the sweep. */
const SHOW_SECONDS_FROM = 1.5;

/** Whole seconds only, rounded up, so it never shows 0 while still cooling. */
const formatSeconds = (left: number): string => String(Math.ceil(left));

/**
 * The cooldown of a skill: a dark sweep that drains from the top, a bright edge on it, the remaining seconds, and
 * a flash when the skill is ready again. Updated every frame without re-rendering.
 */
export function CooldownSweep({ id }: { id: AbilityId }) {
  const sweep = useRef<HTMLSpanElement>(null);
  const time = useRef<HTMLSpanElement>(null);
  const flash = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let wasCooling = false;
    const tick = () => {
      const el = sweep.current;
      if (el) {
        const left = combat.cooldowns[id];
        const f = cooldownFraction(combat.cooldowns, id);
        const noMana = combat.mana < ABILITIES[id].mana;
        const transform = `scaleY(${f})`;
        if (el.style.transform !== transform) el.style.transform = transform;
        const low = noMana && f === 0 ? '1' : '0';
        if (el.dataset.lowMana !== low) el.dataset.lowMana = low;
        if (time.current) {
          const show = left > 0 && ABILITIES[id].cooldown >= SHOW_SECONDS_FROM;
          time.current.textContent = show ? formatSeconds(left) : '';
        }
        if (wasCooling && left <= 0 && flash.current) {
          flash.current.classList.remove('on');
          void flash.current.offsetWidth;
          flash.current.classList.add('on');
        }
        wasCooling = left > 0;
      }
    };
    return addHudTask(tick);
  }, [id]);
  return (
    <>
      <span ref={sweep} className="cooldown-sweep" />
      <span ref={time} className="cooldown-time" />
      <span ref={flash} className="cooldown-flash" />
    </>
  );
}

function HurtVignette() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      addHudTask(() => {
        if (ref.current) ref.current.style.opacity = String(Math.min(1, combat.hurtFlash) * 0.9);
      }),
    [],
  );
  return <div ref={ref} className="hurt-vignette" />;
}

/** The health bar shows the boss of the fight: awake, alive and inside the layer's combat state. */
const activeBoss = (): (typeof combat.enemies)[number] | undefined =>
  combat.enemies.find((e) => isBossKind(e.kind) && e.state !== 'dead' && !!e.brain?.awake);

/** How fast the pale "just lost" part of the bar catches up with the real health (fraction per second, at most). */
const TRAIL_SPEED = 0.35;

/**
 * The boss's health bar, at the top while he is fighting, like the big bosses of an action RPG: his name and phase
 * above a wide bar with notches where his phases change, the health as numbers on it, and a pale trail that shows how
 * much the last hits took. Updated every frame without re-rendering.
 */
function BossBar() {
  const root = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const trail = useRef<HTMLDivElement>(null);
  const name = useRef<HTMLSpanElement>(null);
  const phase = useRef<HTMLSpanElement>(null);
  const numbers = useRef<HTMLSpanElement>(null);
  const notches = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let shownFor: string | null = null;
    let trailAt = 1;
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const el = root.current;
      if (!el) return;
      const boss = activeBoss();
      if (!boss) {
        if (el.style.display !== 'none') el.style.display = 'none';
        shownFor = null;
        return;
      }
      if (el.style.display !== 'flex') el.style.display = 'flex';
      const max = maxHpOf(boss);
      const fraction = Math.max(0, Math.min(1, boss.hp / max));
      if (shownFor !== boss.id) {
        // A new fight: the trail starts at the current health, and the notches move to this boss's phases.
        shownFor = boss.id;
        trailAt = fraction;
        const cfg = bossTuning(boss.kind);
        const marks = notches.current?.children;
        if (marks?.[0]) (marks[0] as HTMLElement).style.left = `${cfg.phase2At * 100}%`;
        if (marks?.[1]) (marks[1] as HTMLElement).style.left = `${cfg.phase3At * 100}%`;
        if (name.current) name.current.textContent = ENEMIES[boss.kind].name;
      }
      trailAt = fraction >= trailAt ? fraction : Math.max(fraction, trailAt - TRAIL_SPEED * dt);
      if (fill.current) fill.current.style.width = `${fraction * 100}%`;
      if (trail.current) trail.current.style.width = `${trailAt * 100}%`;
      if (numbers.current) {
        const full = Math.round(max);
        numbers.current.textContent = `${Math.min(full, Math.ceil(boss.hp)).toLocaleString('en-US')} / ${full.toLocaleString('en-US')}`;
      }
      const stage = boss.brain?.phase ?? 1;
      if (phase.current)
        phase.current.textContent = stage === 3 ? 'FURIOUS' : stage === 2 ? 'ANGRY' : '';
      el.dataset.phase = String(stage);
    };
    return addHudTask(tick);
  }, []);
  return (
    <div ref={root} className="boss-bar" style={{ display: 'none' }} data-phase="1">
      <div className="boss-title">
        <span ref={name} className="boss-name" />
        <span ref={phase} className="boss-phase" />
      </div>
      <div className="boss-hp">
        <div ref={trail} className="boss-hp-trail" />
        <div ref={fill} className="boss-hp-fill" />
        <div ref={notches} className="boss-hp-notches">
          <i />
          <i />
        </div>
        <span ref={numbers} className="boss-hp-num" />
      </div>
    </div>
  );
}

export function CombatHud({ touch }: { touch: boolean }) {
  const hp = useCombatStore((s) => s.hp);
  const mana = useCombatStore((s) => s.mana);
  const downed = useGameStore((s) => s.downed);
  const level = useProgressStore((s) => s.level);
  const xp = useProgressStore((s) => s.xp);
  const equipment = useProgressStore((s) => s.equipment);
  const form = useGameStore((s) => s.form);
  const stats = selectStats({ level, equipment, form });
  const xpFraction = level >= MAX_LEVEL ? 1 : xp / xpToNext(level);

  return (
    <>
      <HurtVignette />
      <BossBar />
      <div className="vitals" aria-label={`Health ${hp}, mana ${mana}`}>
        <div className="bar bar-hp">
          <div
            className="bar-fill"
            style={{ width: `${Math.min(100, (hp / stats.maxHp) * 100)}%` }}
          />
          <span>{hp}</span>
        </div>
        <div className="bar bar-mana">
          <div
            className="bar-fill"
            style={{ width: `${Math.min(100, (mana / stats.maxMana) * 100)}%` }}
          />
          <span>{mana}</span>
        </div>
        <div className="bar bar-xp" aria-label={`Level ${level}`}>
          <div className="bar-fill" style={{ width: `${xpFraction * 100}%` }} />
          <span>{level >= MAX_LEVEL ? `LV ${level} MAX` : `LV ${level}`}</span>
        </div>
        <QuestTracker />
      </div>

      <Toasts />

      {!touch && (
        <div className="ability-bar">
          {SLOTS.map((slot) => (
            <div
              key={slot.id}
              className={`ability-slot${isUnlocked(slot.id, level) ? '' : ' locked'}`}
              title={
                isUnlocked(slot.id, level)
                  ? slot.label
                  : `${slot.label}: unlocks at level ${UNLOCK_LEVEL[slot.id]}`
              }
            >
              <b>{slot.key}</b>
              <AbilityIcon id={slot.id} size={30} form={form} />
              <em>
                {!isUnlocked(slot.id, level)
                  ? `Lv ${UNLOCK_LEVEL[slot.id]}`
                  : slot.id === 'aura' && form === 'mermaid'
                    ? 'Tidal Song'
                    : slot.label}
              </em>
              {ABILITIES[slot.id].mana > 0 && <i>{ABILITIES[slot.id].mana}</i>}
              <CooldownSweep id={slot.id} />
            </div>
          ))}
        </div>
      )}

      {downed && (
        <div className="overlay">
          <div className="panel">
            <h2>You fainted</h2>
            <p>The gloom got the better of Rosa. Rest a moment and try again.</p>
            <button type="button" className="hud-btn big" onClick={reviveAtSpawn}>
              GET UP
            </button>
          </div>
        </div>
      )}
    </>
  );
}
