import { CanvasTexture, SRGBColorSpace } from 'three';

let pool: CanvasTexture | undefined;
let ring: CanvasTexture | undefined;

function canvasTexture(size: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) paint(ctx);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A soft round pool of light: bright in the middle, fading to nothing at the edge. */
export function getPoolTexture(): CanvasTexture {
  pool ??= canvasTexture(64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 1, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });
  return pool;
}

/** A hitbox circle: a crisp ring with a faint fill. Tinted green or red by the material colour. */
export function getRingTexture(): CanvasTexture {
  ring ??= canvasTexture(128, (ctx) => {
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.arc(64, 64, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(64, 64, 57, 0, Math.PI * 2);
    ctx.stroke();
  });
  return ring;
}
