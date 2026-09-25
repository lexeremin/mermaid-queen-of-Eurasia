import { useGameStore } from '@/store/game-store';
import { MenuMermaid } from '@/ui/MenuMermaid';

/** The first screen of a brand new game. */
export function Welcome() {
  const begin = useGameStore((s) => s.setWelcomeOpen);
  const openControls = useGameStore((s) => s.setControlsOpen);
  return (
    <div className="overlay overlay-top">
      <div className="panel menu welcome" role="dialog" aria-label="Welcome">
        <MenuMermaid />
        <p className="menu-sub">Welcome</p>
        <h1 className="menu-title">
          Mermaid Queen <span>of Eurasia</span>
        </h1>
        <p className="welcome-text">
          Moscow has forgotten how to smile. You are Rosa, and you have not.
        </p>
        <p className="welcome-text">
          Sing to win over the people of Red Square, send the gloomy politicians home with your
          trident, and follow the notice board to the depths beneath Manezhnaya Square.
        </p>
        <div className="menu-buttons">
          <button type="button" className="hud-btn primary" onClick={() => begin(false)}>
            Begin
          </button>
          <button type="button" className="hud-btn" onClick={() => openControls(true)}>
            Controls
          </button>
        </div>
      </div>
    </div>
  );
}
