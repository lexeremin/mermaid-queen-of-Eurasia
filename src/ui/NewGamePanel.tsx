import { resetProgress } from '@/save/game-save';
import { useGameStore } from '@/store/game-store';

/** "Start a new game?": two equal buttons. */
export function NewGamePanel() {
  const close = useGameStore((s) => s.setNewGameOpen);
  return (
    <div className="overlay overlay-top">
      <div className="panel dialog" role="dialog" aria-label="New game">
        <h2>New game</h2>
        <p>Start over? Your current progress will be erased.</p>
        <div className="menu-buttons">
          <button
            type="button"
            className="hud-btn danger"
            onClick={() => {
              useGameStore.setState({ paused: false, settingsOpen: false, newGameOpen: false });
              resetProgress();
            }}
          >
            Start new game
          </button>
          <button type="button" className="hud-btn primary" onClick={() => close(false)}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
