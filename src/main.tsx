import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/App';
import '@/index.css';
import { startPersistence } from '@/save/game-save';
import { startSync } from '@/net/sync';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

if (import.meta.env.DEV) {
  void import('@/game/dev-tools').then((m) => m.installDevTools());
}

startPersistence();
startSync();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
