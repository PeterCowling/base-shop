/**
 * ServiceWorkerProvider
 *
 * Registers the service worker on app mount.
 * Also renders offline indicator and update prompt.
 */

'use client';

import { type FC, memo, type ReactNode,useEffect } from 'react';

import { registerServiceWorker } from '../../lib/pwa';

import { OfflineIndicator } from './OfflineIndicator';
import { UpdatePrompt } from './UpdatePrompt';

interface ServiceWorkerProviderProps {
  /** Child components */
  children: ReactNode;
}

/**
 * ServiceWorkerProvider component.
 *
 * Wraps the app and provides PWA functionality.
 */
export const ServiceWorkerProvider: FC<ServiceWorkerProviderProps> = memo(
  function ServiceWorkerProvider({ children }) {
    // Register service worker on mount
    useEffect(() => {
      // Only register in production or when explicitly enabled
      if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_SW === 'true') {
        registerServiceWorker();
      }
    }, []);

    return (
      <>
        {/* Offline indicator at top of viewport */}
        <OfflineIndicator />

        {/* App content */}
        {children}

        {/* Update prompt at bottom of viewport */}
        <UpdatePrompt />
      </>
    );
  },
);

ServiceWorkerProvider.displayName = 'ServiceWorkerProvider';
export default ServiceWorkerProvider;
