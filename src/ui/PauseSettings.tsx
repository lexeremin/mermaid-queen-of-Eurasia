import { useState } from 'react';
import { STATUS_LABEL, useNetStore } from '@/net/net-store';
import { resetProgress } from '@/save/game-save';
import { useSettingsStore } from '@/store/settings-store';

/** Progress and privacy controls shown in the pause menu. */
export function PauseSettings() {
  const optOut = useSettingsStore((s) => s.statsOptOut);
  const setOptOut = useSettingsStore((s) => s.setStatsOptOut);
  const status = useNetStore((s) => s.status);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="pause-settings">
      <p className="hint">{STATUS_LABEL[status]}</p>
      <button
        type="button"
        className="hud-btn"
        aria-pressed={!optOut}
        onClick={() => setOptOut(!optOut)}
      >
        ANONYMOUS STATS: {optOut ? 'OFF' : 'ON'}
      </button>
      {confirming ? (
        <div className="pause-confirm">
          <span>Erase your progress?</span>
          <button
            type="button"
            className="hud-btn danger"
            onClick={() => {
              resetProgress();
              setConfirming(false);
            }}
          >
            YES, NEW GAME
          </button>
          <button type="button" className="hud-btn" onClick={() => setConfirming(false)}>
            CANCEL
          </button>
        </div>
      ) : (
        <button type="button" className="hud-btn" onClick={() => setConfirming(true)}>
          NEW GAME
        </button>
      )}
    </div>
  );
}
