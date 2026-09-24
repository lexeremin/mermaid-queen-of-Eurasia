import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/App';
import '@/index.css';
import { startProgressHooks } from '@/game/progress-actions';
import { startQuestHooks } from '@/game/quest-actions';
import { startPersistence } from '@/save/game-save';
import { startSync } from '@/net/sync';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

if (import.meta.env.DEV) {
  void import('@/game/dev-tools').then((m) => m.installDevTools());
}

startPersistence();
startProgressHooks();
startQuestHooks();
startSync();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
