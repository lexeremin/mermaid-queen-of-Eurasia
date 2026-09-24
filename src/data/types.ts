export type Shape =
  | { kind: 'box'; x: number; z: number; hx: number; hz: number }
  | { kind: 'circle'; x: number; z: number; r: number };
