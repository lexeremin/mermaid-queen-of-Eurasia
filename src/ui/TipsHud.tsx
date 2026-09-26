import { useEffect, useRef, useState } from 'react';
import { isBossKind } from '@/data/enemies';
import { ITEMS } from '@/data/items';
import { combat } from '@/game/combat-sim';
import { currentBoardMark } from '@/game/quest-actions';
import { sim } from '@/game/sim';
import { isSimRunning, useGameStore } from '@/store/game-store';
import { useProgressStore, selectStats } from '@/store/progress-store';
import { useQuestStore } from '@/store/quest-store';
import { useSettingsStore } from '@/store/settings-store';
import { TIP_GAP_SECONDS, TIP_SECONDS, pickTip, type Tip, type TipContext } from '@/systems/tips';
import { addHudTask } from '@/ui/hud-ticker';

/** Anything awake and about, this close, counts as a fight starting. */
const MONSTER_NEAR = 11;
/** How often the tips look at the game. */
const LOOK_EVERY = 0.5;

function readContext(touch: boolean, playSeconds: number): TipContext {
  const progress = useProgressStore.getState();
  const game = useGameStore.getState();
  const stats = selectStats({
    level: progress.level,
    equipment: progress.equipment,
    form: game.form,
  });
  const pos = sim.curr.pos;
  return {
    touch,
    playSeconds,
    level: progress.level,
    questsDone: useQuestStore.getState().log.completed.length,
    hpFraction: combat.hp / stats.maxHp,
    nearPerson: game.nearbyNpc !== null,
    monsterNear: combat.enemies.some(
      (e) =>
        e.state !== 'dead' &&
        !e.dormant &&
        !isBossKind(e.kind) &&
        Math.hypot(e.pos.x - pos.x, e.pos.z - pos.z) <= MONSTER_NEAR,
    ),
    underground: game.underground,
    hasItems: progress.bag.some((slot) => slot !== null),
    hasPotion: progress.bag.some((slot) => {
      const def = slot ? ITEMS[slot.id] : null;
      return !!def && def.kind === 'consumable' && 'heal' in def;
    }),
    boardMark: currentBoardMark(),
  };
}

/**
 * Tips for new players: one card at a time, each once, when it becomes useful (see `systems/tips.ts`). It waits while
 * a menu, a conversation or the loading screen is up, leaves after a while by itself, and can be closed or turned off.
 */
export function TipsHud({ touch }: { touch: boolean }) {
  const enabled = useSettingsStore((s) => s.tips);
  const [shown, setShown] = useState<Tip | null>(null);
  const closeRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!enabled) return;
    let last = performance.now();
    let play = 0;
    let looked = 0;
    let quiet = TIP_GAP_SECONDS - 6;
    let visibleFor = -1;
    const close = () => {
      visibleFor = -1;
      quiet = 0;
      setShown(null);
    };
    closeRef.current = close;
    const stop = addHudTask((now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!isSimRunning(useGameStore.getState())) return;
      play += dt;
      if (visibleFor >= 0) {
        visibleFor += dt;
        if (visibleFor >= TIP_SECONDS) close();
        return;
      }
      quiet += dt;
      looked += dt;
      if (looked < LOOK_EVERY || quiet < TIP_GAP_SECONDS) return;
      looked = 0;
      const seen = useSettingsStore.getState().tipsSeen;
      const tip = pickTip(readContext(touch, play), seen);
      if (!tip) return;
      useSettingsStore.getState().markTipSeen(tip.id);
      visibleFor = 0;
      setShown(tip);
    });
    return () => {
      stop();
      setShown(null);
    };
  }, [enabled, touch]);

  if (!enabled || !shown) return null;
  return (
    <div className="tip-card" role="status" aria-live="polite">
      <div className="tip-head">
        <span>Tip</span>
        <b>{shown.title}</b>
        <button
          type="button"
          className="tip-ok"
          aria-label="Got it"
          onClick={() => closeRef.current()}
        >
          Got it
        </button>
      </div>
      <p>{shown.text(touch)}</p>
      <div className="tip-actions">
        <button
          type="button"
          className="tip-off"
          onClick={() => {
            useSettingsStore.getState().setTips(false);
          }}
        >
          Turn tips off
        </button>
      </div>
    </div>
  );
}
