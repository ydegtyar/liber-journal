import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './i18n';
import { registerPwaVersionBuster } from './lib/pwa';

if (import.meta.env.DEV) {
  import('@locator/runtime').then((locator) => {
    locator.default();
  });
}

registerPwaVersionBuster();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
