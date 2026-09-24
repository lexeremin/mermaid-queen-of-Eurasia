import { ITEMS, type ItemId } from '@/data/items';
import { quickUse } from '@/game/progress-actions';
import { useGameStore } from '@/store/game-store';
import { useProgressStore } from '@/store/progress-store';
import { countOf } from '@/systems/inventory';

const SLOTS: { id: ItemId; key: string }[] = [
  { id: 'healingTea', key: '1' },
  { id: 'coldKvass', key: '2' },
];

export function QuickUse({ touch }: { touch: boolean }) {
  const bag = useProgressStore((s) => s.bag);
  const blocked = useGameStore(
    (s) => s.paused || s.inventoryOpen || !!s.questPanel || s.dialogueOpen || s.downed,
  );
  return (
    <div className={touch ? 'quick-use quick-use-touch' : 'quick-use'}>
      {SLOTS.map(({ id, key }) => {
        const count = countOf(bag, id);
        return (
          <button
            key={id}
            type="button"
            className="quick-btn"
            style={{ borderColor: ITEMS[id].color }}
            disabled={blocked}
            data-empty={count === 0 ? '1' : '0'}
            aria-label={`Use ${ITEMS[id].name}, ${count} left`}
            onClick={() => quickUse(id)}
          >
            <span className="quick-glyph" style={{ color: ITEMS[id].color }}>
              {ITEMS[id].glyph}
            </span>
            <span className="quick-count">{count}</span>
            {!touch && <kbd>{key}</kbd>}
          </button>
        );
      })}
    </div>
  );
}
