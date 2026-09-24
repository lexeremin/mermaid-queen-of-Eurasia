import { useState } from 'react';
import {
  ITEMS,
  RARITY_COLOR,
  type Bonuses,
  type EquipSlot,
  type ItemDef,
  type ItemId,
} from '@/data/items';
import { consumeAt, dropAt } from '@/game/progress-actions';
import { useGameStore } from '@/store/game-store';
import { selectStats, useProgressStore } from '@/store/progress-store';
import { useToastStore } from '@/store/toast-store';
import { MAX_LEVEL, xpToNext } from '@/systems/progression';
import { ItemIcon } from '@/ui/icons';

type Selection = { from: 'bag'; index: number } | { from: 'slot'; slot: EquipSlot } | null;

const SLOT_LABEL: Record<EquipSlot, string> = {
  weapon: 'Weapon',
  outfit: 'Outfit',
  charm: 'Charm',
};
const SLOTS: EquipSlot[] = ['weapon', 'outfit', 'charm'];

const BONUS_LABEL: [keyof Bonuses, (v: number) => string][] = [
  ['damagePct', (v) => `+${v}% damage`],
  ['reductionPct', (v) => `-${v}% damage taken`],
  ['maxHp', (v) => `+${v} health`],
  ['maxMana', (v) => `+${v} mana`],
  ['manaRegen', (v) => `+${v} mana/s`],
];

function bonusLines(def: ItemDef): string[] {
  if (def.kind !== 'equipment') return [];
  const b: Partial<Bonuses> = def.bonuses;
  return BONUS_LABEL.flatMap(([key, fmt]) => {
    const v = b[key];
    return v ? [fmt(v)] : [];
  });
}

const toastFail = (reason: string) =>
  useToastStore.getState().push(reason === 'bag-full' ? 'Bag is full' : 'Nothing to do', 'warn');

export function InventoryPanel() {
  const close = useGameStore((s) => s.toggleInventory);
  const { level, xp, bag, equipment } = useProgressStore();
  const equip = useProgressStore((s) => s.equip);
  const unequip = useProgressStore((s) => s.unequip);
  const [sel, setSel] = useState<Selection>(null);
  const stats = selectStats({ level, equipment });

  const selectedId: ItemId | null =
    sel === null ? null : sel.from === 'bag' ? (bag[sel.index]?.id ?? null) : equipment[sel.slot];
  const def: ItemDef | null = selectedId ? ITEMS[selectedId] : null;

  const afterAction = () => setSel(null);

  return (
    <div className="overlay">
      <div className="panel inventory" role="dialog" aria-label="Inventory">
        <div className="inv-head">
          <h2>Bag</h2>
          <span className="inv-level">
            Level {level}
            {level < MAX_LEVEL ? ` · ${xp}/${xpToNext(level)} XP` : ' · MAX'}
          </span>
        </div>

        <div className="equip-row">
          {SLOTS.map((slot) => {
            const id = equipment[slot];
            const item = id ? ITEMS[id] : null;
            const active = sel?.from === 'slot' && sel.slot === slot;
            return (
              <button
                key={slot}
                type="button"
                className="tile equip-tile"
                data-active={active ? '1' : '0'}
                aria-label={`${SLOT_LABEL[slot]}: ${item?.name ?? 'empty'}`}
                style={item ? { borderColor: RARITY_COLOR[item.rarity] } : undefined}
                onClick={() => setSel({ from: 'slot', slot })}
              >
                <small>{SLOT_LABEL[slot]}</small>
                {item ? (
                  <>
                    <ItemIcon id={item.id} size={34} />
                    <em>{item.name}</em>
                  </>
                ) : (
                  <em>empty</em>
                )}
              </button>
            );
          })}
        </div>

        <div className="stat-line">
          <span>HP {stats.maxHp}</span>
          <span>MP {stats.maxMana}</span>
          <span>DMG {Math.round(stats.damageMult * 100)}%</span>
          <span>DEF {Math.round(stats.reduction * 100)}%</span>
          <span>REG {stats.manaRegen}/s</span>
        </div>

        <div className="bag-grid">
          {bag.map((stack, i) => {
            const item = stack ? ITEMS[stack.id] : null;
            const active = sel?.from === 'bag' && sel.index === i;
            return (
              <button
                key={i}
                type="button"
                className="tile"
                data-active={active ? '1' : '0'}
                aria-label={item ? `${item.name} x${stack?.qty}` : `Empty slot ${i + 1}`}
                style={item ? { borderColor: RARITY_COLOR[item.rarity] } : undefined}
                onClick={() => setSel({ from: 'bag', index: i })}
              >
                {item && stack && (
                  <>
                    <ItemIcon id={item.id} size={34} />
                    {stack.qty > 1 && <b className="tile-qty">{stack.qty}</b>}
                  </>
                )}
              </button>
            );
          })}
        </div>

        <div className="detail">
          {def ? (
            <>
              <div className="detail-head">
                {selectedId && <ItemIcon id={selectedId} size={44} />}
                <strong style={{ color: RARITY_COLOR[def.rarity] }}>{def.name}</strong>
              </div>
              <p>{def.description}</p>
              {bonusLines(def).length > 0 && <p className="bonus">{bonusLines(def).join(' · ')}</p>}
              <div className="detail-actions">
                {sel?.from === 'bag' && def.kind === 'consumable' && (
                  <button
                    type="button"
                    className="hud-btn big"
                    onClick={() => {
                      if (consumeAt(sel.index) === 'used') afterAction();
                    }}
                  >
                    USE
                  </button>
                )}
                {sel?.from === 'bag' && def.kind === 'equipment' && (
                  <button
                    type="button"
                    className="hud-btn big"
                    onClick={() => {
                      const result = equip(sel.index);
                      if (result.ok) afterAction();
                      else toastFail(result.reason);
                    }}
                  >
                    EQUIP
                  </button>
                )}
                {sel?.from === 'slot' && (
                  <button
                    type="button"
                    className="hud-btn big"
                    onClick={() => {
                      const result = unequip(sel.slot);
                      if (result.ok) afterAction();
                      else toastFail(result.reason);
                    }}
                  >
                    UNEQUIP
                  </button>
                )}
                {sel?.from === 'bag' && (
                  <button
                    type="button"
                    className="hud-btn big danger"
                    onClick={() => {
                      dropAt(sel.index);
                      afterAction();
                    }}
                  >
                    DROP
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="hint">Tap an item to see what it does.</p>
          )}
        </div>

        <button type="button" className="hud-btn big" onClick={close}>
          CLOSE
        </button>
      </div>
    </div>
  );
}
