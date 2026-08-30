// Service Worker Registration for Farm Pro PWA

export function registerServiceWorker() {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[Farm Pro] Service Worker registered with scope:', registration.scope);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('[Farm Pro] New offline update available.');
                } else {
                  console.log('[Farm Pro] App is cached and 100% ready for offline standalone usage.');
                }
              }
            };
          };
        })
        .catch((error) => {
          console.warn('[Farm Pro] Service Worker registration failed:', error);
        });
    });
  }
}
