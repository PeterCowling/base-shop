/**
 * UpdatePrompt
 *
 * Shows a prompt when a new version of the app is available.
 * Allows users to update immediately or dismiss.
 */

'use client';

import { type FC, memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useServiceWorker } from '../../lib/pwa';

interface UpdatePromptProps {
  /** Additional className for styling */
  className?: string;
}

/**
 * UpdatePrompt component.
 *
 * Shows only when an update is available.
 */
export const UpdatePrompt: FC<UpdatePromptProps> = memo(function UpdatePrompt({
  className = '',
}) {
  const { t } = useTranslation('Common');
  const { updateAvailable, applyUpdate } = useServiceWorker();

  // Don't render when no update available
  if (!updateAvailable) {
    return null;
  }

  return (
    <div
      role="alert"
      className={`
        fixed bottom-4 left-4 right-4 z-50
        max-w-sm mx-auto
        bg-white dark:bg-gray-800
        rounded-lg shadow-lg
        border border-gray-200 dark:border-gray-700
        p-4
        animate-slideUp
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Update icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-primary-600 dark:text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {t('update.title', 'Update available')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('update.message', 'A new version is ready. Refresh to update.')}
          </p>

          {/* Actions */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={applyUpdate}
              className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700 transition-colors"
            >
              {t('update.refresh', 'Refresh now')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

UpdatePrompt.displayName = 'UpdatePrompt';
export default UpdatePrompt;
