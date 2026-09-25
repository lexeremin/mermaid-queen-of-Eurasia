import { CanvasTexture, SRGBColorSpace } from 'three';

let pool: CanvasTexture | undefined;
let shaft: CanvasTexture | undefined;

function canvasTexture(
  width: number,
  height: number,
  paint: (ctx: CanvasRenderingContext2D) => void,
) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) paint(ctx);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A soft round pool of light: bright in the middle, fading to nothing at the edge. */
export function getPoolTexture(): CanvasTexture {
  pool ??= canvasTexture(64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 1, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });
  return pool;
}

/** A vertical column of light: strongest at the bottom, soft at the sides, gone at the top. */
export function getShaftTexture(): CanvasTexture {
  shaft ??= canvasTexture(32, 128, (ctx) => {
    const image = ctx.createImageData(32, 128);
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 32; x++) {
        const across = 1 - Math.abs((x - 15.5) / 16);
        const up = 1 - y / 127;
        const alpha = Math.pow(across, 1.4) * Math.pow(up, 1.6) * 0.75;
        const i = (y * 32 + x) * 4;
        image.data[i] = 255;
        image.data[i + 1] = 255;
        image.data[i + 2] = 255;
        image.data[i + 3] = Math.round(alpha * 255);
      }
    }
    ctx.putImageData(image, 0, 0);
  });
  return shaft;
}
