import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { Color, type DirectionalLight, type HemisphereLight } from 'three';
import { ATMOSPHERE, UNDERGROUND_ATMOSPHERE, mood } from '@/game/atmosphere';
import { isUnderground } from '@/data/maps/underground';
import { sim } from '@/game/sim';
import { lerp } from '@/utils/math';

const MOOD_RATE = 5;
const surface = {
  background: new Color(ATMOSPHERE.background),
  fog: new Color(ATMOSPHERE.fogColor),
  sky: new Color(ATMOSPHERE.hemisphere.sky),
  ground: new Color(ATMOSPHERE.hemisphere.ground),
  sun: new Color(ATMOSPHERE.sun.color),
};
const below = {
  background: new Color(UNDERGROUND_ATMOSPHERE.background),
  fog: new Color(UNDERGROUND_ATMOSPHERE.fogColor),
  sky: new Color(UNDERGROUND_ATMOSPHERE.hemisphere.sky),
  ground: new Color(UNDERGROUND_ATMOSPHERE.hemisphere.ground),
  sun: new Color(UNDERGROUND_ATMOSPHERE.sun.color),
};

/** The sky, fog and the two global lights, blended by where Rosa is (surface or underground). */
export function AtmosphereRig() {
  const hemisphere = useRef<HemisphereLight>(null);
  const sun = useRef<DirectionalLight>(null);
  const scene = useThree((s) => s.scene);

  useFrame((_, delta) => {
    const target = isUnderground(sim.curr.pos) ? 1 : 0;
    mood.k =
      Math.abs(target - mood.k) < 0.002
        ? target
        : lerp(mood.k, target, 1 - Math.exp(-MOOD_RATE * delta));
    const k = mood.k;
    if (scene.background instanceof Color)
      scene.background.copy(surface.background).lerp(below.background, k);
    if (scene.fog) scene.fog.color.copy(surface.fog).lerp(below.fog, k);
    const h = hemisphere.current;
    if (h) {
      h.color.copy(surface.sky).lerp(below.sky, k);
      h.groundColor.copy(surface.ground).lerp(below.ground, k);
      h.intensity = lerp(
        ATMOSPHERE.hemisphere.intensity,
        UNDERGROUND_ATMOSPHERE.hemisphere.intensity,
        k,
      );
    }
    const s = sun.current;
    if (s) {
      s.color.copy(surface.sun).lerp(below.sun, k);
      s.intensity = lerp(ATMOSPHERE.sun.intensity, UNDERGROUND_ATMOSPHERE.sun.intensity, k);
    }
  });

  return (
    <>
      <hemisphereLight
        ref={hemisphere}
        args={[
          ATMOSPHERE.hemisphere.sky,
          ATMOSPHERE.hemisphere.ground,
          ATMOSPHERE.hemisphere.intensity,
        ]}
      />
      <directionalLight
        ref={sun}
        position={ATMOSPHERE.sun.position}
        color={ATMOSPHERE.sun.color}
        intensity={ATMOSPHERE.sun.intensity}
      />
    </>
  );
}
