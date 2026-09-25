import { playSfx } from '@/audio/sfx';
import { currentMap } from '@/game/world/current-map';
import { travelTo } from '@/game/dungeon-actions';
import { track } from '@/net/stats';
import { useToastStore } from '@/store/toast-store';
import {
  cancelRecall,
  createRecall,
  isInterrupted,
  startRecall,
  stepRecall,
  type RecallInterrupts,
} from '@/systems/recall';

/** Mutable recall channel, read by the renderer and the HUD every frame (like `combat`). */
export const recall = createRecall();

/** T: begins the channel, or stops it if it is already running. */
export function toggleRecall(canStart: boolean): void {
  if (recall.active) {
    cancelRecall(recall);
    useToastStore.getState().push('Recall cancelled', 'info');
  } else if (canStart) {
    startRecall(recall);
    playSfx('wave');
  }
}

/** One fixed step of the channel. Breaks on any interrupt, and on completion carries Rosa to Red Square. */
export function stepRecallChannel(dt: number, interrupts: RecallInterrupts): void {
  if (!recall.active) return;
  if (isInterrupted(interrupts)) {
    cancelRecall(recall);
    useToastStore.getState().push('Recall interrupted', 'warn');
    return;
  }
  if (stepRecall(recall, dt)) {
    track('recall_used');
    playSfx('bubbles');
    travelTo(currentMap.spawn, 'Back on Red Square');
  }
}

export const resetRecall = (): void => cancelRecall(recall);
