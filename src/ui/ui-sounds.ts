import { playSfx } from '@/audio/sfx';

/** Where a click on a button makes a tick: menus, panels, dialogue choices and the HUD's icon buttons, not the action keys. */
const SOUNDING =
  '.panel button, .overlay button, .dialogue button, .tabs button, button.hud-btn, button.icon-btn';
const SILENT = '.action-btn, .joystick, .minimap';

export const soundsOnClick = (target: Element | null): boolean =>
  !!target && !!target.closest(SOUNDING) && !target.closest(SILENT);

/** One delegated listener for the whole page: every button in the menus and panels ticks when clicked. */
export function startUiSounds(): void {
  document.addEventListener(
    'click',
    (event) => {
      if (event.target instanceof Element && soundsOnClick(event.target)) playSfx('ui');
    },
    true,
  );
}
