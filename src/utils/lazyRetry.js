import { lazy } from 'react';

/**
 * A wrapper around React.lazy to handle "Failed to fetch dynamically imported module" errors.
 * This common error happens when a new deployment occurs and the user's browser 
 * is still trying to load old code chunks that have been deleted from the server.
 * 
 * Logic:
 * 1. Attempt the import.
 * 2. If it fails, check if we've already refreshed the page in this session.
 * 3. If not refreshed, force a reload to get the latest index.html and assets.
 */
export const lazyRetry = (componentImport) => {
  return lazy(async () => {
    const pageHasBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      // On success, reset the flag so future chunk failures can trigger a refresh
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasBeenForceRefreshed) {
        console.warn('[RETRY] Chunk load failed. New version likely deployed. Force refreshing...', error);
        
        // Try to clear Service Worker before reload to ensure we get fresh index.html
        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
              await registration.unregister();
            }
          } catch (e) {}
        }

        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }
  });
};
