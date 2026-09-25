import { useGameStore } from '@/store/game-store';
import { summaryLines } from '@/systems/title';
import { MenuMermaid } from '@/ui/MenuMermaid';

/** The first screen: "Welcome" for a brand new game, "Welcome back" with where she left off for a saved one. */
export function Welcome() {
  const begin = useGameStore((s) => s.setWelcomeOpen);
  const returning = useGameStore((s) => s.returning);
  const setReturning = useGameStore((s) => s.setReturning);
  const openControls = useGameStore((s) => s.setControlsOpen);
  const openSettings = useGameStore((s) => s.setSettingsOpen);
  const openNewGame = useGameStore((s) => s.setNewGameOpen);

  if (returning) {
    return (
      <div className="overlay overlay-top">
        <div className="panel menu welcome" role="dialog" aria-label="Welcome back">
          <MenuMermaid />
          <p className="menu-sub">Welcome back</p>
          <h1 className="menu-title">
            Mermaid Queen <span>of Eurasia</span>
          </h1>
          <ul className="title-summary" aria-label="Your game">
            {summaryLines(returning).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <div className="menu-buttons">
            <button
              type="button"
              className="hud-btn primary"
              onClick={() => {
                setReturning(null);
                begin(false);
              }}
            >
              Continue
            </button>
            <button type="button" className="hud-btn" onClick={() => openNewGame(true)}>
              New game
            </button>
            <button type="button" className="hud-btn" onClick={() => openSettings(true)}>
              Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <button type="button" className="hud-btn" onClick={() => openSettings(true)}>
            Settings
          </button>
          <button type="button" className="hud-btn" onClick={() => openControls(true)}>
            Controls
          </button>
        </div>
      </div>
    </div>
  );
}
