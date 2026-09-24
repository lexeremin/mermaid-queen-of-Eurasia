import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { FogExp2, Vector3 } from 'three';
import {
  BASE_FOG_DENSITY,
  CAMERA_DAMPING,
  CAMERA_OFFSET,
  cameraDistanceScale,
} from '@/game/camera';
import { getRenderPosition } from '@/game/sim';

const DEBUG_ZOOM = import.meta.env.DEV
  ? Number(new URLSearchParams(window.location.search).get('zoom')) || 1
  : 1;

const player = { x: 0, z: 0 };
const desired = new Vector3();
const lookAtTarget = new Vector3();

export function CameraRig() {
  const smoothLook = useRef(new Vector3());
  const initialized = useRef(false);

  useFrame((state, delta) => {
    const { camera, scene, size } = state;
    getRenderPosition(player);

    const scale = cameraDistanceScale(size.width / size.height) * DEBUG_ZOOM;
    desired.set(
      player.x + CAMERA_OFFSET[0] * scale,
      CAMERA_OFFSET[1] * scale,
      player.z + CAMERA_OFFSET[2] * scale,
    );
    lookAtTarget.set(player.x, 0, player.z);

    if (!initialized.current) {
      camera.position.copy(desired);
      smoothLook.current.copy(lookAtTarget);
      initialized.current = true;
    } else {
      const k = 1 - Math.exp(-CAMERA_DAMPING * delta);
      camera.position.lerp(desired, k);
      smoothLook.current.lerp(lookAtTarget, k);
    }
    camera.lookAt(smoothLook.current);

    if (scene.fog instanceof FogExp2) scene.fog.density = BASE_FOG_DENSITY / scale;
  });

  return null;
}
