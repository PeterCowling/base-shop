// Middleware helper for preloading i18n namespaces
// This runs on route navigation to preload translations before component mount

import { preloadNamespacesForRoute } from '@/i18n.optimized';

export function preloadTranslations(pathname: string): void {
  // Preload in background - don't block navigation
  requestIdleCallback(
    () => {
      preloadNamespacesForRoute(pathname);
    },
    { timeout: 2000 }
  );
}

// Hook to preload on navigation
export function usePreloadOnNavigation() {
  if (typeof window === 'undefined') return;

  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function (...args) {
    const result = originalPushState.apply(this, args);
    preloadTranslations(window.location.pathname);
    return result;
  };

  window.history.replaceState = function (...args) {
    const result = originalReplaceState.apply(this, args);
    preloadTranslations(window.location.pathname);
    return result;
  };

  // Cleanup
  return () => {
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
  };
}
