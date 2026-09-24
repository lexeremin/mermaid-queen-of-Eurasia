import { RetroModel } from '@/game/assets/RetroModel';

const TREES: readonly [number, number, number, number][] = [
  [-5, -4, 1.0, 0.3],
  [-8, -1, 1.25, 1.1],
  [6, -8, 1.1, 2.0],
  [9, -3, 0.9, 0.7],
  [11, 3, 1.3, 1.9],
  [-11, 4, 1.15, 0.2],
  [-7, 8, 0.95, 2.6],
  [4, 9, 1.2, 0.9],
  [13, -9, 1.0, 1.4],
  [-13, -8, 1.3, 2.2],
  [0, 14, 1.1, 0.5],
  [-3, 12, 0.85, 1.7],
  [15, 10, 1.2, 0.1],
  [-16, 12, 1.0, 2.9],
];

export function PocVillage() {
  return (
    <>
      <RetroModel id="izba" position={[3, 0, -7]} />
      {TREES.map(([x, z, scale, rotation]) => (
        <RetroModel
          key={`${x},${z}`}
          id="spruce"
          position={[x, 0, z]}
          scale={scale}
          rotationY={rotation}
        />
      ))}
    </>
  );
}
