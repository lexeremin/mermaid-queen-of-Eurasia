/** What the title screen tells a returning player about their game. */
export type ReturningSummary = {
  level: number;
  /** The underground layer she is in (0: on the surface). */
  layer: number;
  playSeconds: number;
};

/** "45 min", "3 h 20 min", "1 min" (never "0 min"). */
export function formatPlayTime(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function summaryLines(s: ReturningSummary): string[] {
  return [
    `Level ${s.level}`,
    s.layer > 0 ? `Depth ${s.layer} of 100` : 'On the surface',
    `Played ${formatPlayTime(s.playSeconds)}`,
  ];
}
