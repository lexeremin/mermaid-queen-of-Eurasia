/** Recall: a channelled spell that carries Rosa back to where the game started, on Red Square. */
export const RECALL = { castTime: 3 } as const;

export type RecallState = { active: boolean; t: number };

export const createRecall = (): RecallState => ({ active: false, t: 0 });

export function startRecall(r: RecallState): void {
  r.active = true;
  r.t = 0;
}

export function cancelRecall(r: RecallState): void {
  r.active = false;
  r.t = 0;
}

/** Advances the channel. Returns true on the step it completes (and resets). */
export function stepRecall(r: RecallState, dt: number): boolean {
  if (!r.active) return false;
  r.t += dt;
  if (r.t < RECALL.castTime) return false;
  cancelRecall(r);
  return true;
}

/** 0 to 1 while casting. */
export const recallProgress = (r: RecallState): number =>
  r.active ? Math.min(1, r.t / RECALL.castTime) : 0;

/** What breaks the channel: moving, fighting, using another ability, being hurt or fainting. */
export type RecallInterrupts = {
  moving: boolean;
  acting: boolean;
  hurt: boolean;
  downed: boolean;
};

export const isInterrupted = (i: RecallInterrupts): boolean =>
  i.moving || i.acting || i.hurt || i.downed;
