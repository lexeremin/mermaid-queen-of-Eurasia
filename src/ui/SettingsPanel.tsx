import { stopVoice } from '@/audio/voice';
import { useGameStore } from '@/store/game-store';
import { useSettingsStore } from '@/store/settings-store';
import { nextQuality, qualityLabel } from '@/systems/quality';

/** Sound and anonymous stats, in one small popup. */
export function SettingsPanel() {
  const close = useGameStore((s) => s.setSettingsOpen);
  const openControls = useGameStore((s) => s.setControlsOpen);
  const optOut = useSettingsStore((s) => s.statsOptOut);
  const setOptOut = useSettingsStore((s) => s.setStatsOptOut);
  const soundOn = useSettingsStore((s) => s.soundOn);
  const setSoundOn = useSettingsStore((s) => s.setSoundOn);
  const quality = useSettingsStore((s) => s.quality);
  const setQuality = useSettingsStore((s) => s.setQuality);

  return (
    <div className="overlay overlay-top">
      <div className="panel dialog" role="dialog" aria-label="Settings">
        <h2>Settings</h2>
        <div className="menu-buttons">
          <button
            type="button"
            className="hud-btn"
            aria-pressed={soundOn}
            onClick={() => {
              if (soundOn) stopVoice();
              setSoundOn(!soundOn);
            }}
          >
            Sound: {soundOn ? 'on' : 'off'}
          </button>
          <button
            type="button"
            className="hud-btn"
            aria-pressed={!optOut}
            onClick={() => setOptOut(!optOut)}
          >
            Anonymous stats: {optOut ? 'off' : 'on'}
          </button>
          <button
            type="button"
            className="hud-btn"
            title="Auto lowers the detail when the frame rate drops"
            onClick={() => setQuality(nextQuality(quality))}
          >
            Graphics: {qualityLabel(quality)}
          </button>
          <button type="button" className="hud-btn" onClick={() => openControls(true)}>
            Controls
          </button>
          <button type="button" className="hud-btn primary" onClick={() => close(false)}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
