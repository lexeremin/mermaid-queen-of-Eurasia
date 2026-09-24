import { useEffect } from 'react';
import { input } from '@/input/input-state';
import { attachKeyboardMouse } from '@/input/keyboard';
import { useDialogueStore } from '@/store/dialogue-store';
import { useGameStore } from '@/store/game-store';

export function useInputBridge(): void {
  useEffect(() => {
    const { handleEscape, toggleInventory, setPaused } = useGameStore.getState();
    const detach = attachKeyboardMouse(input, {
      onEscape: () => {
        const dialogue = useDialogueStore.getState();
        if (dialogue.active) dialogue.close();
        else handleEscape();
      },
      onInventory: toggleInventory,
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
