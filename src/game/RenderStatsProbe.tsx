import { useFrame } from '@react-three/fiber';
import { renderStats } from '@/game/render-stats';

export function RenderStatsProbe() {
  useFrame(({ gl, scene }) => {
    renderStats.calls = gl.info.render.calls;
    renderStats.triangles = gl.info.render.triangles;
    renderStats.tailZ = scene.getObjectByName('tail1')?.rotation.y ?? 0;
  });
  return null;
}
