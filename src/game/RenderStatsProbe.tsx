import { useFrame } from '@react-three/fiber';
import { renderStats } from '@/game/render-stats';

let frame = 0;

export function RenderStatsProbe() {
  useFrame(({ gl, scene }) => {
    (window as { __mqScene?: unknown }).__mqScene = scene;
    renderStats.calls = gl.info.render.calls;
    renderStats.triangles = gl.info.render.triangles;
    if (++frame % 20 !== 0) return;
    const joint = scene.getObjectByName('leg_l') ?? scene.getObjectByName('tail1');
    renderStats.pose = joint
      ? Math.abs(joint.rotation.x) + Math.abs(joint.rotation.y) + Math.abs(joint.rotation.z)
      : 0;
  });
  return null;
}
