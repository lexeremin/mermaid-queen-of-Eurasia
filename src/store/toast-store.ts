import { create } from 'zustand';

export type ToastKind = 'xp' | 'item' | 'warn' | 'info';
export type Toast = { id: number; text: string; kind: ToastKind };

const LIFETIME_MS = 2600;
const MAX_TOASTS = 4;
let nextId = 1;

type ToastState = {
  toasts: Toast[];
  levelUp: { level: number; id: number } | null;
  push: (text: string, kind?: ToastKind) => void;
  announceLevelUp: (level: number) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  levelUp: null,
  push: (text, kind = 'info') => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-(MAX_TOASTS - 1)), { id, text, kind }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), LIFETIME_MS);
  },
  announceLevelUp: (level) => {
    const id = nextId++;
    set({ levelUp: { level, id } });
    setTimeout(() => set((s) => (s.levelUp?.id === id ? { levelUp: null } : s)), 2600);
  },
}));
