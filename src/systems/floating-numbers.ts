/** Floating damage numbers: pure list handling (the game keeps one list and draws it as HTML). */
export type NumberKind = 'enemy' | 'player' | 'big';

export type FloatingNumber = {
  id: number;
  /** Where it appeared, on the ground plane. */
  x: number;
  z: number;
  text: string;
  kind: NumberKind;
  age: number;
  life: number;
  /** A little sideways drift so several numbers on one enemy do not sit on top of each other. */
  drift: number;
};

export const NUMBER_LIFE = 0.9;
export const MAX_NUMBERS = 24;
/** A hit at least this big is drawn larger and gold. */
export const BIG_HIT = 35;

/** How high the number has floated (metres above where it started) after `age` seconds: quick, then slowing. */
export const rise = (age: number, life: number): number =>
  1.6 * (1 - (1 - Math.min(1, age / life)) ** 2);

/** How visible the number is: fully for most of its life, fading in the last third. */
export const opacity = (age: number, life: number): number =>
  Math.max(0, Math.min(1, (life - age) / (life / 3)));

export function pushNumber(
  list: FloatingNumber[],
  id: number,
  x: number,
  z: number,
  amount: number,
  kind: 'enemy' | 'player',
): void {
  const rounded = Math.round(amount);
  if (rounded <= 0) return;
  const big = kind === 'enemy' && rounded >= BIG_HIT;
  list.push({
    id,
    x,
    z,
    text: kind === 'player' ? `-${rounded}` : String(rounded),
    kind: big ? 'big' : kind,
    age: 0,
    life: NUMBER_LIFE,
    drift: ((id * 37) % 11) / 11 - 0.5,
  });
  while (list.length > MAX_NUMBERS) list.shift();
}

/** Ages every number and drops the ones that are done (in place). */
export function stepNumbers(list: FloatingNumber[], dt: number): void {
  for (let i = list.length - 1; i >= 0; i--) {
    const n = list[i]!;
    n.age += dt;
    if (n.age >= n.life) list.splice(i, 1);
  }
}
