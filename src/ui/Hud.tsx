import { useGameStore } from '@/store/game-store';
import { NPC_BY_ID } from '@/data/npcs';
import { visitPlace } from '@/game/GameLoop';
import type { PlaceId } from '@/store/game-store';
import { useDialogueStore } from '@/store/dialogue-store';
import { DebugOverlay } from '@/ui/DebugOverlay';
import { CombatHud } from '@/ui/CombatHud';
import { DialogueBox } from '@/ui/DialogueBox';
import { ControlsPanel } from '@/ui/ControlsPanel';
import { Welcome } from '@/ui/Welcome';
import { RecallButton } from '@/ui/RecallButton';
import { QuickUse } from '@/ui/QuickUse';
import { UiIcon } from '@/ui/icons';
import { FollowerButton } from '@/ui/FollowerButton';
import { InventoryPanel } from '@/ui/InventoryPanel';
import { QuestPanel } from '@/ui/QuestPanel';
import { MenuMermaid } from '@/ui/MenuMermaid';
import { SettingsPanel } from '@/ui/SettingsPanel';
import { NewGamePanel } from '@/ui/NewGamePanel';
import { TouchControls } from '@/ui/TouchControls';
import { useTouchDevice } from '@/ui/use-touch-device';
import '@/ui/hud.css';

const PLACE_LABEL: Record<PlaceId, { touch: string; key: string }> = {
  board: { touch: 'NOTICE BOARD', key: 'Notice Board' },
  shrine: { touch: 'PEARL SHRINE', key: 'Pearl Shrine' },
  'metro-down': { touch: 'GO DOWN', key: 'Descend to the metro' },
  'metro-up': { touch: 'GO UP', key: 'Climb the stairs' },
};

const GITHUB_URL = 'https://github.com/lexeremin/mermaid-queen-of-Eurasia';

export function Hud() {
  const touch = useTouchDevice();
  const paused = useGameStore((s) => s.paused);
  const inventoryOpen = useGameStore((s) => s.inventoryOpen);
  const questPanel = useGameStore((s) => s.questPanel);
  const nearPlace = useGameStore((s) => s.nearPlace);
  const welcomeOpen = useGameStore((s) => s.welcomeOpen);
  const controlsOpen = useGameStore((s) => s.controlsOpen);
  const settingsOpen = useGameStore((s) => s.settingsOpen);
  const setSettingsOpen = useGameStore((s) => s.setSettingsOpen);
  const newGameOpen = useGameStore((s) => s.newGameOpen);
  const setNewGameOpen = useGameStore((s) => s.setNewGameOpen);
  const transitioning = useGameStore((s) => s.transitioning);
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

      <div className={`fade-overlay${transitioning ? ' on' : ''}`} aria-hidden="true" />

      <div className="hud-top">
        <button
          type="button"
          className="icon-btn"
          onClick={toggleQuestLog}
          aria-label="Quests"
          title="Quests (J)"
        >
          <UiIcon id="quests" />
          {!touch && <kbd>J</kbd>}
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={toggleInventory}
          aria-label="Inventory"
          title="Bag (I)"
        >
          <UiIcon id="bag" />
          {!touch && <kbd>I</kbd>}
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={togglePause}
          aria-label="Pause"
          title="Menu (Esc)"
        >
          <UiIcon id="pause" />
          {!touch && <kbd>Esc</kbd>}
        </button>
      </div>

      {zone && !paused && !welcomeOpen && !inventoryOpen && !questPanel && (
        <div key={zone.id} className="zone-hint">
          {zone.label}
        </div>
      )}

      {nearbyNpc && !paused && !inventoryOpen && !questPanel && !dialogueOpen && (
        <button type="button" className="talk-prompt" onClick={() => openDialogue(nearbyNpc)}>
          {touch ? 'TALK' : 'E'} · {NPC_BY_ID.get(nearbyNpc)?.name}
        </button>
      )}

      {nearPlace && !nearbyNpc && !paused && !inventoryOpen && !questPanel && !dialogueOpen && (
        <button type="button" className="talk-prompt" onClick={() => visitPlace(nearPlace)}>
          {touch ? PLACE_LABEL[nearPlace].touch : `E · ${PLACE_LABEL[nearPlace].key}`}
        </button>
      )}

      {touch && !paused && !welcomeOpen && !inventoryOpen && !questPanel && !dialogueOpen && (
        <TouchControls />
      )}

      <div className={touch ? 'dock dock-touch' : 'dock'}>
        <FollowerButton />
        <div className="dock-row">
          {!touch && <RecallButton touch={false} />}
          <QuickUse touch={touch} />
        </div>
      </div>

      <DialogueBox />

      {inventoryOpen && <InventoryPanel />}
      {questPanel && <QuestPanel />}

      {paused && !welcomeOpen && (
        <div className="overlay">
          <div className="panel menu">
            <MenuMermaid />
            <h1 className="menu-title">
              Mermaid Queen <span>of Eurasia</span>
            </h1>
            <p className="menu-sub">Paused</p>
            <div className="menu-buttons">
              <button type="button" className="hud-btn primary" onClick={togglePause}>
                Resume
              </button>
              <button type="button" className="hud-btn" onClick={() => setNewGameOpen(true)}>
                New game
              </button>
              <button type="button" className="hud-btn" onClick={() => setSettingsOpen(true)}>
                Settings
              </button>
              <a className="hud-btn" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                lexeremin on Github
              </a>
            </div>
          </div>
        </div>
      )}

      {welcomeOpen && <Welcome />}
      {settingsOpen && <SettingsPanel />}
      {newGameOpen && <NewGamePanel />}
      {controlsOpen && <ControlsPanel touch={touch} />}
    </div>
  );
}
