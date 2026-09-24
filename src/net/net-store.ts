import { create } from 'zustand';

export type NetStatus =
  | 'off' // not configured: local-only play
  | 'misconfigured'
  | 'connecting'
  | 'online'
  | 'auth-disabled' // anonymous sign-ins are off in the Supabase project
  | 'offline'; // network trouble, retrying with backoff

type NetState = {
  status: NetStatus;
  detail: string | null;
  setStatus: (status: NetStatus, detail?: string | null) => void;
};

export const useNetStore = create<NetState>((set) => ({
  status: 'off',
  detail: null,
  setStatus: (status, detail = null) => set({ status, detail }),
}));

export const STATUS_LABEL: Record<NetStatus, string> = {
  off: 'Cloud: not configured (local save only)',
  misconfigured: 'Cloud: invalid settings',
  connecting: 'Cloud: connecting…',
  online: 'Cloud: synced',
  'auth-disabled': 'Cloud: anonymous sign-ins are disabled in Supabase',
  offline: 'Cloud: offline, will retry',
};
