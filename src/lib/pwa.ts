import { registerSW } from 'virtual:pwa-register';

const UPDATE_CHECK_INTERVAL_MS = 15 * 60 * 1000; // Check every 15 minutes

export function registerPwaVersionBuster(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Prevent multiple reload loops
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      console.log('[PWA] New version activated, reloading terminal...');
      window.location.reload();
    }
  });

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('[PWA] Update found. Applying new version buster...');
      updateSW(true);
    },
    onOfflineReady() {
      console.log('[PWA] App is ready for offline use.');
    },
    onRegisteredSW(swUrl, registration) {
      console.log(
        `[PWA] Service Worker registered: ${swUrl} (v${typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0'} build:${typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : 'dev'})`
      );

      if (!registration) return;

      const triggerUpdate = () => {
        registration.update().catch((err) => {
          console.warn('[PWA] Update check failed:', err);
        });
      };

      // Periodic check
      setInterval(triggerUpdate, UPDATE_CHECK_INTERVAL_MS);

      // Check on tab focus or when app returns from background
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          triggerUpdate();
        }
      });

      window.addEventListener('focus', () => {
        triggerUpdate();
      });
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration failed:', error);
    },
  });
}
