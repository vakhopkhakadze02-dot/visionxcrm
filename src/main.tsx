import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {migrateLegacyStorage} from './storage.ts';
import './index.css';

// Move any pre-scoping data into the local workspace before the app reads it.
migrateLegacyStorage();

// The service worker is registered by vite-plugin-pwa (injectRegister: 'auto'),
// which injects its own registration script at build time. Registering it here
// as well was a duplicate.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
