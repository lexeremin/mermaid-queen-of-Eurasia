import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/App';
import '@/index.css';
import { startProgressHooks } from '@/game/progress-actions';
import { startGardenHooks } from '@/game/garden-actions';
import { startQuestHooks } from '@/game/quest-actions';
import { startPersistence } from '@/save/game-save';
import { startSync } from '@/net/sync';
import { unlockAudio } from '@/audio/voice';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

if (import.meta.env.DEV) {
  void import('@/game/dev-tools').then((m) => m.installDevTools());
}

startPersistence();
startProgressHooks();
startQuestHooks();
startGardenHooks();
startSync();

for (const type of ['pointerdown', 'keydown'] as const) {
  window.addEventListener(type, unlockAudio, { once: true, capture: true });
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
