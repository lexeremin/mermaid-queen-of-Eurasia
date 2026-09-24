import { useGameStore } from '@/store/game-store';
import { NPC_BY_ID } from '@/data/npcs';
import { useDialogueStore } from '@/store/dialogue-store';
import { DebugOverlay } from '@/ui/DebugOverlay';
import { CombatHud } from '@/ui/CombatHud';
import { DialogueBox } from '@/ui/DialogueBox';
import { FollowerButton } from '@/ui/FollowerButton';
import { InventoryPanel } from '@/ui/InventoryPanel';
import { QuestPanel } from '@/ui/QuestPanel';
import { MenuMermaid } from '@/ui/MenuMermaid';
import { PauseSettings } from '@/ui/PauseSettings';
import { TouchControls } from '@/ui/TouchControls';
import { useTouchDevice } from '@/ui/use-touch-device';
import '@/ui/hud.css';

const GITHUB_URL = 'https://github.com/lexeremin/mermaid-queen-of-Eurasia';

export function Hud() {
  const touch = useTouchDevice();
  const paused = useGameStore((s) => s.paused);
  const inventoryOpen = useGameStore((s) => s.inventoryOpen);
  const questPanel = useGameStore((s) => s.questPanel);
  const nearBoard = useGameStore((s) => s.nearBoard);
  const openQuestPanel = useGameStore((s) => s.openQuestPanel);
  const toggleQuestLog = useGameStore((s) => s.toggleQuestLog);
  const zone = useGameStore((s) => s.zone);
  const dialogueOpen = useGameStore((s) => s.dialogueOpen);
  const nearbyNpc = useGameStore((s) => s.nearbyNpc);
  const openDialogue = useDialogueStore((s) => s.open);
  const togglePause = useGameStore((s) => s.togglePause);
  const toggleInventory = useGameStore((s) => s.toggleInventory);

  return (
    <div className="hud">
      {import.meta.env.DEV && <DebugOverlay />}

      <CombatHud touch={touch} />

      <div className="hud-top">
        <button type="button" className="hud-btn" onClick={toggleQuestLog} aria-label="Quests">
          {touch ? 'LOG' : 'QUESTS'}
        </button>
        <button type="button" className="hud-btn" onClick={toggleInventory} aria-label="Inventory">
          BAG
        </button>
        <button type="button" className="hud-btn" onClick={togglePause} aria-label="Pause">
          PAUSE
        </button>
      </div>

      {zone && !paused && !inventoryOpen && !questPanel && (
        <div key={zone.id} className="zone-hint">
          {zone.label}
        </div>
      )}

      {nearbyNpc && !paused && !inventoryOpen && !questPanel && !dialogueOpen && (
        <button type="button" className="talk-prompt" onClick={() => openDialogue(nearbyNpc)}>
          {touch ? 'TALK' : 'E'} · {NPC_BY_ID.get(nearbyNpc)?.name}
        </button>
      )}

      {nearBoard && !nearbyNpc && !paused && !inventoryOpen && !questPanel && !dialogueOpen && (
        <button type="button" className="talk-prompt" onClick={() => openQuestPanel('board')}>
          {touch ? 'NOTICE BOARD' : 'E · Notice Board'}
        </button>
      )}

      {touch && !paused && !inventoryOpen && !questPanel && !dialogueOpen && <TouchControls />}

      <FollowerButton touch={touch} />

      <DialogueBox />

      {inventoryOpen && <InventoryPanel />}
      {questPanel && <QuestPanel />}

      {paused && (
        <div className="overlay">
          <div className="panel menu">
            <MenuMermaid />
            <h1 className="menu-title">
              Mermaid Queen <span>of Eurasia</span>
            </h1>
            <p className="menu-sub">Paused</p>
            {!touch && (
              <p className="hint">
                WASD move · click to walk · click a person to talk · Space / right-click attack ·
                Shift dash · Q aura · R spell · E interact · I bag · J quests · 1 / 2 quick use ·
                ESC pause
              </p>
            )}
            <button type="button" className="hud-btn big" onClick={togglePause}>
              RESUME
            </button>
            <PauseSettings />
            <a
              className="hud-btn menu-link"
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              GITHUB PROJECT
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
