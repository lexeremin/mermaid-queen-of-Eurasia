import { useFrame } from '@react-three/fiber';
import { createFrameWindow, recordFrame } from '@/systems/frame-stats';

/** `?perf=1` in the address turns on the on-device performance report (works in the production build). */
export const perfEnabled =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('perf') === '1';

/** What the renderer reports, kept for the overlay. */
export const perf = {
  window: createFrameWindow(),
  calls: 0,
  triangles: 0,
  textures: 0,
  geometries: 0,
  dpr: 1,
  width: 0,
  height: 0,
  gpu: '',
};

function gpuName(gl: WebGLRenderingContext | WebGL2RenderingContext): string {
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  return String(name);
}

/** Inside the Canvas: samples frame times and the renderer's counters every frame. */
export function PerfProbe() {
  useFrame(({ gl, size }, delta) => {
    recordFrame(perf.window, delta * 1000);
    perf.calls = gl.info.render.calls;
    perf.triangles = gl.info.render.triangles;
    perf.textures = gl.info.memory.textures;
    perf.geometries = gl.info.memory.geometries;
    perf.dpr = gl.getPixelRatio();
    perf.width = size.width;
    perf.height = size.height;
    if (!perf.gpu) perf.gpu = gpuName(gl.getContext());
  });
  return null;
}
