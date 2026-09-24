import { useEffect } from 'react';
import { input } from '@/input/input-state';
import { attachKeyboardMouse } from '@/input/keyboard';
import { useDialogueStore } from '@/store/dialogue-store';
import { canQuickUse, quickUse } from '@/game/progress-actions';
import { useGameStore } from '@/store/game-store';

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
      onQuickUse: (slot) => {
        if (canQuickUse()) quickUse(slot === 0 ? 'healingTea' : 'coldKvass');
      },
    });
    const onVisibility = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      detach();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}
