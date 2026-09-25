import { BOSS_EVERY, MAX_LAYER } from '@/data/maps/underground';
import { depthChoices, goDown } from '@/game/dungeon-actions';
import { useDungeonStore } from '@/store/dungeon-store';
import { useGameStore } from '@/store/game-store';

const labelOf = (layer: number, deepest: number): string => {
  if (layer === 1) return 'Ticket Hall';
  if (layer === deepest) return 'Deepest reached';
  return layer % BOSS_EVERY === 0 ? 'Guardian layer' : 'Landing';
};

/** The metro door once Rosa has been deeper than the first layer: pick where to go down to. */
export function DepthPanel() {
  const close = useGameStore((s) => s.closeQuestPanel);
  const deepest = useDungeonStore((s) => s.deepest);
  const choices = depthChoices(deepest);

  return (
    <div className="overlay">
      <div className="panel depth" role="dialog" aria-label="Metro depth">
        <div className="inv-head">
          <h2>Moscow Underground</h2>
          <span className="inv-level">
            Deepest {deepest} / {MAX_LAYER}
          </span>
        </div>
        <p>Where does the metro take you? Every tenth layer you have reached is a stop.</p>
        <div className="depth-list">
          {choices.map((layer) => (
            <button
              key={layer}
              type="button"
              className="hud-btn big"
              onClick={() => {
                close();
                goDown(layer);
              }}
            >
              <b>Layer {layer}</b>
              <span>{labelOf(layer, deepest)}</span>
            </button>
          ))}
        </div>
        <button type="button" className="hud-btn" onClick={close}>
          Stay on the surface
        </button>
      </div>
    </div>
  );
}
