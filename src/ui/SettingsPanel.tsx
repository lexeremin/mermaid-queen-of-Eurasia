import { stopVoice } from '@/audio/voice';
import { useGameStore } from '@/store/game-store';
import { useSettingsStore } from '@/store/settings-store';
import { nextQuality, qualityLabel } from '@/systems/quality';

/** Sound, effects, graphics and anonymous stats, in one popup. */
export function SettingsPanel() {
  const close = useGameStore((s) => s.setSettingsOpen);
  const openControls = useGameStore((s) => s.setControlsOpen);
  const optOut = useSettingsStore((s) => s.statsOptOut);
  const setOptOut = useSettingsStore((s) => s.setStatsOptOut);
  const soundOn = useSettingsStore((s) => s.soundOn);
  const setSoundOn = useSettingsStore((s) => s.setSoundOn);
  const quality = useSettingsStore((s) => s.quality);
  const setQuality = useSettingsStore((s) => s.setQuality);
  const volume = useSettingsStore((s) => s.volume);
  const setVolume = useSettingsStore((s) => s.setVolume);
  const ambience = useSettingsStore((s) => s.ambience);
  const setAmbience = useSettingsStore((s) => s.setAmbience);
  const shake = useSettingsStore((s) => s.shake);
  const setShake = useSettingsStore((s) => s.setShake);
  const weather = useSettingsStore((s) => s.weather);
  const setWeather = useSettingsStore((s) => s.setWeather);
  const numbers = useSettingsStore((s) => s.damageNumbers);
  const setNumbers = useSettingsStore((s) => s.setDamageNumbers);

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
          <label className="slider">
            <span>Volume {Math.round(volume * 100)}%</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              aria-label="Volume"
            />
          </label>
          <label className="slider">
            <span>Ambience {Math.round(ambience * 100)}%</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(ambience * 100)}
              onChange={(e) => setAmbience(Number(e.target.value) / 100)}
              aria-label="Ambience"
            />
          </label>
          <button
            type="button"
            className="hud-btn"
            aria-pressed={shake}
            onClick={() => setShake(!shake)}
          >
            Screen shake: {shake ? 'on' : 'off'}
          </button>
          <button
            type="button"
            className="hud-btn"
            aria-pressed={weather}
            onClick={() => setWeather(!weather)}
          >
            Weather: {weather ? 'on' : 'off'}
          </button>
          <button
            type="button"
            className="hud-btn"
            aria-pressed={numbers}
            onClick={() => setNumbers(!numbers)}
          >
            Damage numbers: {numbers ? 'on' : 'off'}
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
