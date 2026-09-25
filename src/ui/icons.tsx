import type { ReactNode } from 'react';
import type { ItemId } from '@/data/items';
import type { AbilityId } from '@/systems/abilities';

const INK = '#3b2a4d';
const line = {
  stroke: INK,
  strokeWidth: 2.4,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const;

function Icon({ children, size, label }: { children: ReactNode; size: number; label?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      style={{ display: 'block' }}
    >
      {children}
    </svg>
  );
}

const Sparkle = ({ x, y, s = 3 }: { x: number; y: number; s?: number }) => (
  <path
    d={`M${x} ${y - s * 2} L${x + s * 0.6} ${y - s * 0.6} L${x + s * 2} ${y} L${x + s * 0.6} ${y + s * 0.6} L${x} ${y + s * 2} L${x - s * 0.6} ${y + s * 0.6} L${x - s * 2} ${y} L${x - s * 0.6} ${y - s * 0.6} Z`}
    fill="#fff8d6"
    stroke={INK}
    strokeWidth={1.4}
    strokeLinejoin="round"
  />
);

const Heart = ({
  x,
  y,
  s = 1,
  fill = '#ff8fb0',
}: {
  x: number;
  y: number;
  s?: number;
  fill?: string;
}) => (
  <path
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M0 4 C-7 -1 -4 -7 0 -3 C4 -7 7 -1 0 4 Z"
    fill={fill}
    stroke={INK}
    strokeWidth={1.6 / s}
    strokeLinejoin="round"
  />
);

/* ---------- abilities ---------- */

const ABILITY_ICONS: Record<AbilityId, ReactNode> = {
  attack: (
    <>
      <path d="M24 16 V43" stroke={INK} strokeWidth={6.4} strokeLinecap="round" />
      <path d="M24 16 V43" stroke="#ffd36e" strokeWidth={3.2} strokeLinecap="round" />
      <path
        d="M11 17 Q11 27 24 27 Q37 27 37 17"
        fill="none"
        stroke={INK}
        strokeWidth={6.4}
        strokeLinecap="round"
      />
      <path
        d="M11 17 Q11 27 24 27 Q37 27 37 17"
        fill="none"
        stroke="#ffd36e"
        strokeWidth={3.2}
        strokeLinecap="round"
      />
      <path d="M24 4 L28.5 16 H19.5 Z" fill="#7be6d6" {...line} />
      <path d="M11 4 L15.5 16 H6.5 Z" fill="#7be6d6" {...line} />
      <path d="M37 4 L41.5 16 H32.5 Z" fill="#7be6d6" {...line} />
      <Heart x={24} y={36} s={0.9} />
    </>
  ),
  aura: (
    <>
      <path
        d="M17 34 V12 L36 8 V30"
        fill="none"
        stroke={INK}
        strokeWidth={6.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 34 V12 L36 8 V30"
        fill="none"
        stroke="#ffb0cb"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="12.5" cy="35" rx="6.2" ry="5" fill="#ff8fb0" {...line} />
      <ellipse cx="31.5" cy="31" rx="6.2" ry="5" fill="#ff8fb0" {...line} />
      <Heart x={24} y={19} s={1.1} fill="#fff1a8" />
      <Sparkle x={40} y={18} s={2.2} />
      <Sparkle x={7} y={16} s={1.8} />
    </>
  ),
  blink: (
    <>
      <ellipse cx="14" cy="36" rx="9" ry="4.5" fill="#bfe9ff" {...line} />
      <ellipse cx="14" cy="36" rx="4.5" ry="2" fill="#7fc8f5" />
      <ellipse cx="35" cy="14" rx="9" ry="4.5" fill="#ffd0e4" {...line} />
      <ellipse cx="35" cy="14" rx="4.5" ry="2" fill="#ff9fc4" />
      <path
        d="M17 31 Q21 20 30 18"
        fill="none"
        stroke={INK}
        strokeWidth={5.4}
        strokeLinecap="round"
        strokeDasharray="1 6.5"
      />
      <path
        d="M17 31 Q21 20 30 18"
        fill="none"
        stroke="#fff5a8"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeDasharray="1 6.5"
      />
      <Sparkle x={24} y={26} s={2.6} />
      <Sparkle x={41} y={30} s={1.8} />
      <circle cx="7" cy="19" r="2" fill="#e4fbff" {...line} strokeWidth={1.4} />
    </>
  ),
  spell: (
    <>
      <path
        d="M4 34 Q6 20 20 16 Q30 13 32 6 Q40 12 40 24 Q44 26 44 34 Z"
        fill="#5fd6c8"
        {...line}
      />
      <path d="M4 34 Q14 28 24 34 Q34 40 44 34 V42 H4 Z" fill="#2f9fb0" {...line} />
      <path d="M32 6 Q38 13 34 21 Q29 15 32 6 Z" fill="#f4fdff" {...line} />
      <path
        d="M12 26 Q15 22 20 22"
        fill="none"
        stroke="#e6fffb"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <circle cx="37" cy="12" r="1.8" fill="#fff" />
      <circle cx="41" cy="18" r="1.4" fill="#fff" />
      <circle cx="10" cy="41" r="1.5" fill="#dff9ff" />
    </>
  ),
};

export function AbilityIcon({ id, size = 32 }: { id: AbilityId; size?: number }) {
  return <Icon size={size}>{ABILITY_ICONS[id]}</Icon>;
}

/* ---------- items ---------- */

const tridentIcon = (metal: string, gem?: string): ReactNode => (
  <>
    <path d="M24 16 V44" stroke={INK} strokeWidth={6} strokeLinecap="round" />
    <path d="M24 16 V44" stroke={metal} strokeWidth={3} strokeLinecap="round" />
    <path
      d="M12 16 Q12 26 24 26 Q36 26 36 16"
      fill="none"
      stroke={INK}
      strokeWidth={6}
      strokeLinecap="round"
    />
    <path
      d="M12 16 Q12 26 24 26 Q36 26 36 16"
      fill="none"
      stroke={metal}
      strokeWidth={3}
      strokeLinecap="round"
    />
    <path d="M24 3 L28 16 H20 Z" fill={metal} {...line} />
    <path d="M12 6 L15.5 16 H8.5 Z" fill={metal} {...line} />
    <path d="M36 6 L39.5 16 H32.5 Z" fill={metal} {...line} />
    {gem && <circle cx="24" cy="33" r="3.6" fill={gem} {...line} strokeWidth={1.8} />}
    {gem && <circle cx="22.9" cy="31.9" r="1" fill="#fff" />}
    <Sparkle x={40} y={30} s={2} />
  </>
);

const ITEM_ICONS: Record<ItemId, ReactNode> = {
  healingTea: (
    <>
      <path d="M9 21 H35 V31 Q35 41 22 41 Q9 41 9 31 Z" fill="#fff4e0" {...line} />
      <path d="M35 24 H38 Q43 24 43 29 Q43 34 37 34 H34" fill="none" {...line} strokeWidth={2.6} />
      <path d="M9 26 H35" stroke="#ffb36b" strokeWidth={4} />
      <path d="M16 45 H28" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      <path
        d="M18 17 Q14 13 18 9 Q22 5 18 2"
        fill="none"
        stroke="#ffb0cb"
        strokeWidth={2.6}
        strokeLinecap="round"
      />
      <Heart x={28} y={12} s={1} />
      <circle cx="17" cy="33" r="1.4" fill={INK} />
      <circle cx="27" cy="33" r="1.4" fill={INK} />
      <path
        d="M20 35 Q22 37 24 35"
        fill="none"
        stroke={INK}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </>
  ),
  coldKvass: (
    <>
      <path d="M12 12 H32 V38 Q32 43 27 43 H17 Q12 43 12 38 Z" fill="#c9fff6" {...line} />
      <path
        d="M32 17 H37 Q42 17 42 23 V29 Q42 35 37 35 H32"
        fill="none"
        {...line}
        strokeWidth={2.6}
      />
      <path d="M12 24 H32 V38 Q32 43 27 43 H17 Q12 43 12 38 Z" fill="#7be6d6" />
      <path d="M12 12 H32 V38 Q32 43 27 43 H17 Q12 43 12 38 Z" fill="none" {...line} />
      <path d="M11 12 Q11 5 17 6 Q19 2 24 4 Q29 2 31 6 Q35 7 33 12 Z" fill="#fff" {...line} />
      <circle cx="18" cy="30" r="2" fill="#e8fffb" />
      <circle cx="25" cy="35" r="1.6" fill="#e8fffb" />
      <circle cx="17" cy="19" r="1.4" fill={INK} />
      <circle cx="27" cy="19" r="1.4" fill={INK} />
      <path
        d="M20 22 Q22 24 24 22"
        fill="none"
        stroke={INK}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </>
  ),
  roseHip: (
    <>
      <path d="M24 10 Q22 4 16 4 Q18 9 21 10" fill="#78c777" {...line} />
      <path d="M24 10 Q28 5 34 7 Q31 11 27 11" fill="#5fb865" {...line} />
      <ellipse cx="15" cy="30" rx="8" ry="9.5" fill="#ff7a90" {...line} />
      <ellipse cx="32" cy="27" rx="9" ry="10.5" fill="#f0506a" {...line} />
      <path
        d="M11 26 Q12 22 16 21"
        fill="none"
        stroke="#ffd0d8"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <path
        d="M28 22 Q29 18 33 17"
        fill="none"
        stroke="#ffd0d8"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <path d="M27 17 Q24 12 24 10" fill="none" {...line} strokeWidth={2} />
      <circle cx="15" cy="39.5" r="1.4" fill={INK} />
      <circle cx="32" cy="37.5" r="1.4" fill={INK} />
      <Sparkle x={41} y={12} s={2} />
    </>
  ),
  moonMint: (
    <>
      <path d="M24 44 V22" stroke={INK} strokeWidth={5.4} strokeLinecap="round" />
      <path d="M24 44 V22" stroke="#66c29a" strokeWidth={2.6} strokeLinecap="round" />
      <path d="M24 24 Q10 22 8 10 Q22 8 24 24 Z" fill="#8fe3c4" {...line} />
      <path d="M24 24 Q38 22 40 10 Q26 8 24 24 Z" fill="#8fe3c4" {...line} />
      <path d="M24 36 Q13 35 11 26 Q22 24 24 36 Z" fill="#6fd0aa" {...line} />
      <path d="M24 36 Q35 35 37 26 Q26 24 24 36 Z" fill="#6fd0aa" {...line} />
      <path
        d="M14 15 Q17 15 19 19 M34 15 Q31 15 29 19"
        fill="none"
        stroke="#e6fff5"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <path
        d="M38 26 a5 5 0 1 0 5 7 a4 4 0 0 1 -5 -7 Z"
        fill="#fff8d6"
        {...line}
        strokeWidth={1.6}
      />
    </>
  ),
  pearl: (
    <>
      <path d="M5 30 Q5 14 24 14 Q43 14 43 30 Q43 42 24 42 Q5 42 5 30 Z" fill="#ffc6dc" {...line} />
      <path
        d="M12 30 V22 M18 28 V17 M24 27 V16 M30 28 V17 M36 30 V22"
        stroke={INK}
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity="0.45"
      />
      <circle cx="24" cy="28" r="9" fill="#fff5fa" {...line} />
      <path
        d="M19.5 25 Q21 22 24.5 22"
        fill="none"
        stroke="#fff"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <path
        d="M19 27 Q22 25 26 27"
        fill="none"
        stroke="#f3c9dc"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Sparkle x={38} y={9} s={2.4} />
    </>
  ),
  trident: tridentIcon('#ffd36e'),
  silverTrident: tridentIcon('#e3ecf5'),
  pearlTrident: tridentIcon('#ffe1a6', '#fff5fa'),
  tweedJacket: (
    <>
      <path
        d="M17 6 L24 12 L31 6 L43 12 L41 26 L35 24 V42 H13 V24 L7 26 L5 12 Z"
        fill="#fbf3e2"
        {...line}
      />
      <path d="M24 12 V42" stroke={INK} strokeWidth={2} />
      <path d="M17 6 L24 21 L31 6" fill="#efe1c4" {...line} strokeWidth={2} />
      <path
        d="M13 32 H35 M13 37 H35 M8 17 L11 22 M40 17 L37 22"
        stroke="#d8c7a2"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <circle cx="28" cy="28" r="1.7" fill="#ffd36e" {...line} strokeWidth={1.2} />
      <circle cx="28" cy="35" r="1.7" fill="#ffd36e" {...line} strokeWidth={1.2} />
      <Heart x={17} y={30} s={0.7} fill="#ffb0cb" />
    </>
  ),
  rainCloak: (
    <>
      <path d="M17 6 Q24 3 31 6 L43 40 Q24 46 5 40 Z" fill="#7fb8e6" {...line} />
      <path d="M17 6 Q24 12 31 6" fill="#5b93cc" {...line} />
      <path
        d="M24 12 V42"
        stroke={INK}
        strokeWidth={2}
        strokeDasharray="1 5"
        strokeLinecap="round"
      />
      <circle cx="24" cy="12" r="2" fill="#ffd36e" {...line} strokeWidth={1.4} />
      <path
        d="M12 25 q-1.5 3 0 4.5 q1.5 -1.5 0 -4.5 M35 20 q-1.5 3 0 4.5 q1.5 -1.5 0 -4.5 M31 33 q-1.5 3 0 4.5 q1.5 -1.5 0 -4.5"
        fill="#dff4ff"
        stroke={INK}
        strokeWidth={1.2}
      />
      <path d="M8 6 q-3 4 0 6 q3 -2 0 -6" fill="#dff4ff" stroke={INK} strokeWidth={1.2} />
    </>
  ),
  velvetGown: (
    <>
      <path d="M18 5 H30 L29 15 L36 43 Q24 47 12 43 L19 15 Z" fill="#b06bd6" {...line} />
      <path d="M19 15 H29" stroke={INK} strokeWidth={2.4} />
      <path
        d="M16 5 Q24 12 32 5"
        fill="none"
        stroke={INK}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <path
        d="M17 30 Q24 35 31 30"
        fill="none"
        stroke="#d9a9f0"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <path d="M22 5 V13 M26 5 V13" stroke="#d9a9f0" strokeWidth={1.6} />
      <path
        d="M14 40 Q24 44 34 40"
        fill="none"
        stroke="#ffd36e"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <Heart x={24} y={22} s={0.9} fill="#ffb0cb" />
      <Sparkle x={38} y={14} s={2} />
    </>
  ),
  roseBrooch: (
    <>
      <path
        d="M24 26 Q14 32 8 26 Q14 22 20 24 Z M24 26 Q34 32 40 26 Q34 22 28 24 Z"
        fill="#78c777"
        {...line}
      />
      <circle cx="24" cy="20" r="12" fill="#ff8fb0" {...line} />
      <path
        d="M24 12 Q30 14 29 20 Q27 25 22 24 Q18 22 19 18 Q20 15 24 16 Q27 17 26 20"
        fill="none"
        stroke={INK}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <circle cx="14" cy="14" r="1.4" fill="#fff" />
      <circle cx="24" cy="38" r="5" fill="#ffd36e" {...line} />
      <circle cx="24" cy="38" r="1.8" fill="#fff5fa" />
      <Sparkle x={40} y={10} s={2.2} />
    </>
  ),
  amberPendant: (
    <>
      <path
        d="M8 4 Q8 22 24 26 Q40 22 40 4"
        fill="none"
        stroke={INK}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <path
        d="M8 4 Q8 22 24 26 Q40 22 40 4"
        fill="none"
        stroke="#ffd36e"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <path d="M24 24 Q13 33 24 46 Q35 33 24 24 Z" fill="#ffab3d" {...line} />
      <path
        d="M19.5 33 Q20 29.5 23 28.5"
        fill="none"
        stroke="#ffe6b0"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <circle cx="26" cy="38" r="1.5" fill="#c46e12" />
      <circle cx="24" cy="24" r="2.6" fill="#ffd36e" {...line} strokeWidth={1.6} />
      <Sparkle x={39} y={36} s={2.2} />
    </>
  ),
  registrarSeal: (
    <>
      <path
        d="M24 5 L28 9 L34 8 L35 14 L41 17 L38 23 L41 29 L35 32 L34 38 L28 37 L24 42 L20 37 L14 38 L13 32 L7 29 L10 23 L7 17 L13 14 L14 8 L20 9 Z"
        fill="#e05a6c"
        {...line}
      />
      <circle cx="24" cy="23" r="9" fill="#ffd36e" {...line} />
      <path
        d="M20 23 L23 26 L29 19"
        fill="none"
        stroke={INK}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Sparkle x={39} y={9} s={2.2} />
    </>
  ),
  songbirdWhistle: (
    <>
      <path
        d="M8 26 Q8 12 22 12 Q34 12 34 22 L44 20 L37 28 Q34 40 20 40 Q8 40 8 26 Z"
        fill="#ffe08a"
        {...line}
      />
      <path
        d="M13 28 Q19 34 27 30"
        fill="none"
        stroke="#ffb36b"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle cx="22" cy="21" r="2.2" fill={INK} />
      <circle cx="21.3" cy="20.3" r="0.8" fill="#fff" />
      <circle cx="14" cy="26" r="2.2" fill="#ff8fb0" opacity="0.8" />
      <circle cx="8" cy="8" r="2.2" fill="#dff4ff" {...line} strokeWidth={1.6} />
      <path
        d="M32 6 V13 M32 6 L37 5 V8"
        fill="none"
        stroke={INK}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
};

export function ItemIcon({ id, size = 36, label }: { id: ItemId; size?: number; label?: string }) {
  return (
    <Icon size={size} label={label}>
      {ITEM_ICONS[id]}
    </Icon>
  );
}

/* ---------- interface ---------- */

export type UiIconId = 'quests' | 'bag' | 'pause' | 'recall';

const UI_ICONS: Record<UiIconId, ReactNode> = {
  // A rolled scroll with writing.
  quests: (
    <>
      <path
        d="M12 8 H36 Q40 8 40 12 V36 Q40 40 36 40 H14 Q10 40 10 36 V12"
        fill="#fff1c9"
        {...line}
      />
      <path d="M12 8 Q6 8 6 13 Q6 18 12 18 H16 V8 Z" fill="#f3d58a" {...line} />
      <path
        d="M16 18 V36 Q16 40 12 40"
        fill="none"
        stroke={INK}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <path
        d="M22 16 H34 M22 22 H34 M22 28 H30"
        stroke="#9b6bd0"
        strokeWidth={2.6}
        strokeLinecap="round"
      />
      <Sparkle x={38} y={10} s={2} />
    </>
  ),
  // A satchel with a strap and a buckle.
  bag: (
    <>
      <path
        d="M17 15 Q17 6 24 6 Q31 6 31 15"
        fill="none"
        stroke={INK}
        strokeWidth={3.4}
        strokeLinecap="round"
      />
      <path
        d="M9 18 Q9 14 14 14 H34 Q39 14 39 18 L41 38 Q41 43 36 43 H12 Q7 43 7 38 Z"
        fill="#e0a06a"
        {...line}
      />
      <path
        d="M8.5 24 Q24 31 39.5 24"
        fill="none"
        stroke={INK}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <rect x="20" y="24" width="8" height="9" rx="2" fill="#ffd36e" {...line} strokeWidth={2} />
      <circle cx="24" cy="28.5" r="1.4" fill={INK} />
    </>
  ),
  // The game menu: a round badge with two bars.
  pause: (
    <>
      <circle cx="24" cy="24" r="18" fill="#bfe9ff" {...line} />
      <rect
        x="15.5"
        y="14.5"
        width="6.5"
        height="19"
        rx="2.4"
        fill="#fff"
        {...line}
        strokeWidth={2.2}
      />
      <rect
        x="26"
        y="14.5"
        width="6.5"
        height="19"
        rx="2.4"
        fill="#fff"
        {...line}
        strokeWidth={2.2}
      />
    </>
  ),
  // A swirling portal.
  recall: (
    <>
      <circle cx="24" cy="24" r="18" fill="#7fb8f0" {...line} />
      <path
        d="M24 9 Q39 12 38 26 Q36 38 24 38 Q13 37 13 27 Q14 18 24 17 Q31 17 31 24 Q30 30 24 30 Q20 29 21 25"
        fill="none"
        stroke="#fff"
        strokeWidth={3.2}
        strokeLinecap="round"
      />
      <Sparkle x={38} y={9} s={2.2} />
      <circle cx="10" cy="38" r="1.8" fill="#e4fbff" />
    </>
  ),
};

export function UiIcon({ id, size = 30 }: { id: UiIconId; size?: number }) {
  return <Icon size={size}>{UI_ICONS[id]}</Icon>;
}
