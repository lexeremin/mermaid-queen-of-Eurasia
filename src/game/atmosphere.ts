/** Single source of the scene mood: a heavy, overcast summer day. Warm colors mean hope. */
export const ATMOSPHERE = {
  background: '#7d858a',
  fogColor: '#7d858a',
  fogDensity: 0.03,
  hemisphere: { sky: '#aab2b6', ground: '#30362d', intensity: 1.25 },
  sun: { color: '#cdd4d8', intensity: 1.0, position: [8, 12, 6] as [number, number, number] },
  rosaLight: { color: '#ffb8cc', intensity: 24, distance: 11, height: 1.8 },
} as const;
