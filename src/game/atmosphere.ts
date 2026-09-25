/** Single source of the scene mood: a heavy, overcast summer day. Warm colors mean hope. */
export const ATMOSPHERE = {
  background: '#7d858a',
  fogColor: '#7d858a',
  fogDensity: 0.03,
  hemisphere: { sky: '#aab2b6', ground: '#30362d', intensity: 1.25 },
  sun: { color: '#cdd4d8', intensity: 1.0, position: [8, 12, 6] as [number, number, number] },
  rosaLight: { color: '#ffb8cc', intensity: 24, distance: 11, height: 1.8 },
} as const;

/** The Moscow underground: dark and torch-lit, with a little cool light left in the air. */
export const UNDERGROUND_ATMOSPHERE = {
  background: '#0c0910',
  fogColor: '#0c0910',
  fogDensity: 0.032,
  hemisphere: { sky: '#6a5a78', ground: '#20182a', intensity: 1.05 },
  sun: { color: '#9a8aa8', intensity: 0.25 },
} as const;

/** How far the mood has moved from the surface (0) to the underground (1). Written by AtmosphereRig each frame. */
export const mood = { k: 0 };

export const fogDensityFor = (k: number): number =>
  ATMOSPHERE.fogDensity + (UNDERGROUND_ATMOSPHERE.fogDensity - ATMOSPHERE.fogDensity) * k;
