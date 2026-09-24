import { useGameStore } from '@/store/game-store';
import { DebugOverlay } from '@/ui/DebugOverlay';
import { TouchControls } from '@/ui/TouchControls';
import { useTouchDevice } from '@/ui/use-touch-device';
import '@/ui/hud.css';

export function Hud() {
  const touch = useTouchDevice();
  const paused = useGameStore((s) => s.paused);
  const inventoryOpen = useGameStore((s) => s.inventoryOpen);
  const zone = useGameStore((s) => s.zone);
  const togglePause = useGameStore((s) => s.togglePause);
  const toggleInventory = useGameStore((s) => s.toggleInventory);

  return (
    <div className="hud">
      {import.meta.env.DEV && <DebugOverlay />}

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

      {touch && !paused && !inventoryOpen && <TouchControls />}

      {inventoryOpen && (
        <div className="overlay">
          <div className="panel">
            <h2>Inventory</h2>
            <p>Items and equipment arrive in a later phase.</p>
            <button type="button" className="hud-btn big" onClick={toggleInventory}>
              CLOSE
            </button>
          </div>
        </div>
      )}

      {paused && (
        <div className="overlay">
          <div className="panel">
            <h2>Paused</h2>
            {!touch && (
              <p className="hint">
                WASD move · click to walk · Space / right-click attack · Shift dash · Q aura · R
                spell · E interact · I inventory · ESC pause
              </p>
            )}
            <button type="button" className="hud-btn big" onClick={togglePause}>
              RESUME
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
