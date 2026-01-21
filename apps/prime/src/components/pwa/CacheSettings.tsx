/**
 * CacheSettings
 *
 * Component for managing cached data.
 * Allows users to see cache size and clear cached data.
 */

'use client';

import { FC, memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useServiceWorker } from '../../lib/pwa';

interface CacheSettingsProps {
  /** Additional className for styling */
  className?: string;
}

/**
 * Format bytes to human-readable size.
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * CacheSettings component.
 *
 * Shows cache info and allows clearing cached data.
 */
export const CacheSettings: FC<CacheSettingsProps> = memo(function CacheSettings({
  className = '',
}) {
  const { t } = useTranslation('Settings');
  const { isSupported, cacheSize, clearCachedData, refreshCacheSize } = useServiceWorker();
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  const handleClearCache = useCallback(async () => {
    setIsClearing(true);
    setClearSuccess(false);

    try {
      const success = await clearCachedData();
      setClearSuccess(success);

      if (success) {
        // Show success briefly, then reset
        setTimeout(() => setClearSuccess(false), 2000);
      }
    } finally {
      setIsClearing(false);
    }
  }, [clearCachedData]);

  if (!isSupported) {
    return null;
  }

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-lg
        border border-gray-200 dark:border-gray-700
        p-4
        ${className}
      `}
    >
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
        {t('cache.title', 'Cached Data')}
      </h3>

      {/* Cache size info */}
      {cacheSize && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">
              {t('cache.usage', 'Storage used')}
            </span>
            <span className="text-gray-900 dark:text-white">
              {formatBytes(cacheSize.usage)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(parseFloat(cacheSize.usagePercent), 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('cache.quota', '{{percent}}% of available storage', {
              percent: cacheSize.usagePercent,
            })}
          </p>
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {t(
          'cache.description',
          'Cached data helps the app work offline. Clearing it may require re-downloading content.',
        )}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleClearCache}
          disabled={isClearing}
          className={`
            px-4 py-2 text-sm font-medium rounded-lg
            transition-colors
            ${
              clearSuccess
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isClearing
            ? t('cache.clearing', 'Clearing...')
            : clearSuccess
              ? t('cache.cleared', 'Cleared!')
              : t('cache.clear', 'Clear cached data')}
        </button>

        <button
          onClick={refreshCacheSize}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          title={t('cache.refresh', 'Refresh')}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </div>
  );
});

CacheSettings.displayName = 'CacheSettings';
export default CacheSettings;
