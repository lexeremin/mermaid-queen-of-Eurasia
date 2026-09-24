import { useEffect, useRef } from 'react';
import { combat, reviveAtSpawn } from '@/game/combat-sim';
import { useCombatStore } from '@/store/combat-store';
import { useGameStore } from '@/store/game-store';
import { useProgressStore, selectStats } from '@/store/progress-store';
import { xpToNext, MAX_LEVEL } from '@/systems/progression';
import { ABILITIES, cooldownFraction, type AbilityId } from '@/systems/abilities';
import { QuickUse } from '@/ui/QuickUse';
import { Toasts } from '@/ui/Toasts';

const SLOTS: { id: AbilityId; key: string; label: string }[] = [
  { id: 'attack', key: 'Space', label: 'Trident' },
  { id: 'dash', key: 'Shift', label: 'Dash' },
  { id: 'aura', key: 'Q', label: 'Aura' },
  { id: 'spell', key: 'R', label: 'Surge' },
];

/** Vertical sweep that shrinks as the cooldown ends. Updated every frame without re-rendering. */
export function CooldownSweep({ id }: { id: AbilityId }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const f = cooldownFraction(combat.cooldowns, id);
        const noMana = combat.mana < ABILITIES[id].mana;
        el.style.transform = `scaleY(${f})`;
        el.dataset.lowMana = noMana && f === 0 ? '1' : '0';
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [id]);
  return <span ref={ref} className="cooldown-sweep" />;
}

function HurtVignette() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (ref.current) ref.current.style.opacity = String(Math.min(1, combat.hurtFlash) * 0.9);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div ref={ref} className="hurt-vignette" />;
}

export function CombatHud({ touch }: { touch: boolean }) {
  const hp = useCombatStore((s) => s.hp);
  const mana = useCombatStore((s) => s.mana);
  const downed = useGameStore((s) => s.downed);
  const level = useProgressStore((s) => s.level);
  const xp = useProgressStore((s) => s.xp);
  const equipment = useProgressStore((s) => s.equipment);
  const stats = selectStats({ level, equipment });
  const xpFraction = level >= MAX_LEVEL ? 1 : xp / xpToNext(level);

  return (
    <>
      <HurtVignette />
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
      </div>

      <QuickUse touch={touch} />
      <Toasts />

      {!touch && (
        <div className="ability-bar">
          {SLOTS.map((slot) => (
            <div key={slot.id} className="ability-slot" title={slot.label}>
              <b>{slot.key}</b>
              <em>{slot.label}</em>
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
