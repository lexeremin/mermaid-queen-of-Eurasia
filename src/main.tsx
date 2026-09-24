import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/App';
import '@/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

if (import.meta.env.DEV) {
  void import('@/game/dev-tools').then((m) => m.installDevTools());
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
