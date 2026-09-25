import { useGameStore } from '@/store/game-store';

type Row = [keys: string, what: string];

const KEYBOARD: { title: string; rows: Row[] }[] = [
  {
    title: 'Moving and talking',
    rows: [
      ['W A S D / arrows', 'Walk'],
      ['Left click on the ground', 'Walk there (finds its own way)'],
      ['Left click on a person', 'Walk up and talk'],
      ['E', 'Talk, or use what is in front of you (notice board, shrine, metro, stairs)'],
    ],
  },
  {
    title: 'Skills',
    rows: [
      ['Space / right click', 'Trident: hits everything in front of you'],
      ['Shift', 'Blink: jump toward the mouse cursor (15 mana, over walls)'],
      ['Q', 'Aura: sing to charm people and blind monsters (30 mana)'],
      ['R', 'Surge: a wave that hurts everything near you (35 mana)'],
      ['T', 'Recall: stand still for 3 s to return to Red Square'],
      ['F', 'Change form (once the mermaid form is unlocked): Tidal Song and swimming'],
    ],
  },
  {
    title: 'Items and menus',
    rows: [
      ['1 / 2', 'Healing tea / cold kvass'],
      ['I', 'Bag and equipment'],
      ['J', 'Quest log'],
      ['Esc', 'This menu'],
    ],
  },
];

const TOUCH: { title: string; rows: Row[] }[] = [
  {
    title: 'Moving and talking',
    rows: [
      ['Left stick', 'Walk'],
      ['Tap a person', 'Walk up and talk'],
      ['Prompt button', 'Talk, or use what is in front of you'],
    ],
  },
  {
    title: 'Skills',
    rows: [
      ['ATK', 'Trident: hits everything in front of you'],
      ['BLINK', 'Jump the way you are moving or facing (15 mana)'],
      ['AURA', 'Sing to charm people and blind monsters (30 mana)'],
      ['SPELL', 'A wave that hurts everything near you (35 mana)'],
      ['Round icon above SPELL', 'Recall: stand still for 3 s to return to Red Square'],
      ['Mermaid icon (left)', 'Change form once unlocked: Tidal Song and swimming'],
    ],
  },
  {
    title: 'Items and menus',
    rows: [
      ['Potion buttons', 'Healing tea / cold kvass'],
      ['Scroll, satchel, pause icons', 'Quests, bag, menu'],
    ],
  },
];

/** The keybindings popup: what every key (or touch button) does. */
export function ControlsPanel({ touch }: { touch: boolean }) {
  const close = useGameStore((s) => s.setControlsOpen);
  const groups = touch ? TOUCH : KEYBOARD;
  return (
    <div className="overlay overlay-top">
      <div className="panel controls" role="dialog" aria-label="Controls">
        <h2>Controls</h2>
        {groups.map((group) => (
          <section key={group.title} className="controls-group">
            <h3>{group.title}</h3>
            {group.rows.map(([keys, what]) => (
              <div key={keys} className="controls-row">
                <kbd>{keys}</kbd>
                <span>{what}</span>
              </div>
            ))}
          </section>
        ))}
        <div className="menu-buttons">
          <button type="button" className="hud-btn primary" onClick={() => close(false)}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
