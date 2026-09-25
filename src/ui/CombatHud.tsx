import { useEffect, useRef } from 'react';
import { ENEMIES } from '@/data/enemies';
import { combat, reviveAtSpawn } from '@/game/combat-sim';
import { useCombatStore } from '@/store/combat-store';
import { useGameStore } from '@/store/game-store';
import { useProgressStore, selectStats } from '@/store/progress-store';
import { xpToNext, MAX_LEVEL } from '@/systems/progression';
import { ABILITIES, cooldownFraction, type AbilityId } from '@/systems/abilities';
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
        el.style.transform = `scaleY(${f})`;
        el.dataset.lowMana = noMana && f === 0 ? '1' : '0';
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

/** The boss's health bar, shown at the top while he is fighting. Updated every frame without re-rendering. */
function BossBar() {
  const root = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const name = useRef<HTMLElement>(null);
  useEffect(() => {
    let source: typeof combat | null = null;
    let boss: (typeof combat.enemies)[number] | undefined;
    const tick = () => {
      // The boss is looked up again only when the combat state was replaced (a new game).
      if (source !== combat) {
        source = combat;
        boss = combat.enemies.find((e) => e.kind === 'boss');
      }
      const el = root.current;
      if (el && boss) {
        const show = !!boss.brain?.awake && boss.state !== 'dead';
        el.style.display = show ? 'flex' : 'none';
        if (show && fill.current && name.current) {
          fill.current.style.width = `${Math.max(0, (boss.hp / ENEMIES.boss.maxHp) * 100)}%`;
          const phase = boss.brain?.phase ?? 1;
          name.current.textContent = `${ENEMIES.boss.name}${phase > 1 ? ' · ' + (phase === 3 ? 'FURIOUS' : 'ANGRY') : ''}`;
        }
      }
    };
    return addHudTask(tick);
  }, []);
  return (
    <div ref={root} className="boss-bar" style={{ display: 'none' }}>
      <em ref={name} />
      <div className="boss-track">
        <div ref={fill} className="boss-fill" />
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
            <div key={slot.id} className="ability-slot" title={slot.label}>
              <b>{slot.key}</b>
              <AbilityIcon id={slot.id} size={30} form={form} />
              <em>{slot.id === 'aura' && form === 'mermaid' ? 'Tidal Song' : slot.label}</em>
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
