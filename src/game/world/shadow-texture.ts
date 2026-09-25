import { CanvasTexture, SRGBColorSpace } from 'three';

let shared: CanvasTexture | undefined;

/** A soft round falloff (white centre to transparent edge) used for every blob shadow. */
export function getShadowTexture(): CanvasTexture {
  if (!shared) {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const g = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.55, 'rgba(255,255,255,0.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    shared = new CanvasTexture(canvas);
    shared.colorSpace = SRGBColorSpace;
  }
  return shared;
}
