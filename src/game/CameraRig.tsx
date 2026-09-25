import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { FogExp2, Vector3 } from 'three';
import { fogDensityFor, mood } from '@/game/atmosphere';
import { CAMERA_DAMPING, CAMERA_OFFSET, cameraDistanceScale } from '@/game/camera';
import { shake } from '@/game/feedback';
import { getRenderPosition } from '@/game/sim';
import { shakeOffset } from '@/systems/shake';

const DEBUG_ZOOM = import.meta.env.DEV
  ? Number(new URLSearchParams(window.location.search).get('zoom')) || 1
  : 1;

const player = { x: 0, z: 0 };
const desired = new Vector3();
const lookAtTarget = new Vector3();

export function CameraRig() {
  const smoothLook = useRef(new Vector3());
  const initialized = useRef(false);
  const lastPlayer = useRef({ x: 0, z: 0 });
  const lastShake = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const { camera, scene, size } = state;
    getRenderPosition(player);
    // Take last frame's shake back out first, so the camera never chases its own wobble.
    camera.position.x -= lastShake.current.x;
    camera.position.y -= lastShake.current.y;

    const scale = cameraDistanceScale(size.width / size.height) * DEBUG_ZOOM;
    desired.set(
      player.x + CAMERA_OFFSET[0] * scale,
      CAMERA_OFFSET[1] * scale,
      player.z + CAMERA_OFFSET[2] * scale,
    );
    lookAtTarget.set(player.x, 0, player.z);

    // A teleport (metro, stairs) snaps the camera instead of gliding across the map.
    if (Math.hypot(player.x - lastPlayer.current.x, player.z - lastPlayer.current.z) > 20) {
      initialized.current = false;
    }
    lastPlayer.current.x = player.x;
    lastPlayer.current.z = player.z;

    if (!initialized.current) {
      camera.position.copy(desired);
      smoothLook.current.copy(lookAtTarget);
      initialized.current = true;
    } else {
      const k = 1 - Math.exp(-CAMERA_DAMPING * delta);
      camera.position.lerp(desired, k);
      smoothLook.current.lerp(lookAtTarget, k);
    }
    const wobble = shakeOffset(shake.trauma, state.clock.elapsedTime);
    camera.position.x += wobble.x;
    camera.position.y += wobble.y;
    lastShake.current = wobble;
    camera.lookAt(smoothLook.current);

    if (scene.fog instanceof FogExp2) scene.fog.density = fogDensityFor(mood.k) / scale;
  });

  return null;
}
