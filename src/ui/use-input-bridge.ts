import { useEffect } from 'react';
import { input, resetPointerInput } from '@/input/input-state';
import { attachInputReset } from '@/input/input-reset';
import { attachKeyboardMouse } from '@/input/keyboard';
import { useDialogueStore } from '@/store/dialogue-store';
import { canQuickUse, quickUse } from '@/game/progress-actions';
import { isSimRunning, useGameStore } from '@/store/game-store';

export function useInputBridge(): void {
  useEffect(() => {
    const { handleEscape, toggleInventory, toggleQuestLog, setPaused } = useGameStore.getState();
    const detach = attachKeyboardMouse(input, {
      onEscape: () => {
        const dialogue = useDialogueStore.getState();
        if (dialogue.active) dialogue.close();
        else handleEscape();
      },
      onInventory: toggleInventory,
      onQuests: toggleQuestLog,
      onMap: () => useGameStore.getState().toggleMap(false),
      onQuickUse: (slot) => {
        if (canQuickUse()) quickUse(slot === 0 ? 'healingTea' : 'coldKvass');
      },
    });
    const detachReset = attachInputReset(useGameStore, input, isSimRunning);
    const onVisibility = () => {
      if (document.hidden) {
        resetPointerInput(input);
        setPaused(true);
      }
    };
    const onPageHide = () => resetPointerInput(input);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      detach();
      detachReset();
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}
