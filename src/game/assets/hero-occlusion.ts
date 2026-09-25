/**
 * Set by the buildings' see-through fade whenever something tall is really between the camera and Rosa. Her X-ray
 * twins (a second draw call per body part) only need to exist while that is true.
 */
export const heroOcclusion = { until: 0 };

export const HERO_OCCLUSION_HOLD_MS = 350;

export const heroIsOccluded = (now: number): boolean => now < heroOcclusion.until;
