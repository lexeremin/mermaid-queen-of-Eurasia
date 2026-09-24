import { useGameStore } from '@/store/game-store';
import { NPC_BY_ID } from '@/data/npcs';
import { useDialogueStore } from '@/store/dialogue-store';
import { DebugOverlay } from '@/ui/DebugOverlay';
import { CombatHud } from '@/ui/CombatHud';
import { DialogueBox } from '@/ui/DialogueBox';
import { InventoryPanel } from '@/ui/InventoryPanel';
import { PauseSettings } from '@/ui/PauseSettings';
import { TouchControls } from '@/ui/TouchControls';
import { useTouchDevice } from '@/ui/use-touch-device';
import '@/ui/hud.css';

export function Hud() {
  const touch = useTouchDevice();
  const paused = useGameStore((s) => s.paused);
  const inventoryOpen = useGameStore((s) => s.inventoryOpen);
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
        <button type="button" className="hud-btn" onClick={toggleInventory} aria-label="Inventory">
          BAG
        </button>
        <button type="button" className="hud-btn" onClick={togglePause} aria-label="Pause">
          PAUSE
        </button>
      </div>

      {zone && !paused && !inventoryOpen && (
        <div key={zone.id} className="zone-hint">
          {zone.label}
        </div>
      )}

      {nearbyNpc && !paused && !inventoryOpen && !dialogueOpen && (
        <button type="button" className="talk-prompt" onClick={() => openDialogue(nearbyNpc)}>
          {touch ? 'TALK' : 'E'} · {NPC_BY_ID.get(nearbyNpc)?.name}
        </button>
      )}

      {touch && !paused && !inventoryOpen && !dialogueOpen && <TouchControls />}

      <DialogueBox />

      {inventoryOpen && <InventoryPanel />}

      {paused && (
        <div className="overlay">
          <div className="panel">
            <h2>Paused</h2>
            {!touch && (
              <p className="hint">
                WASD move · click to walk · click a person to talk · Space / right-click attack ·
                Shift dash · Q aura · R spell · E interact · I inventory · ESC pause
              </p>
            )}
            <button type="button" className="hud-btn big" onClick={togglePause}>
              RESUME
            </button>
            <PauseSettings />
          </div>
        </div>
      )}
    </div>
  );
}
