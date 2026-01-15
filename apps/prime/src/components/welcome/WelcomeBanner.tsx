/**
 * WelcomeBanner
 *
 * Displays a welcome message after check-in.
 * Shows a celebratory message with the guest's name.
 * Dismisses automatically after a short delay or on user action.
 */

'use client';

import { FC, memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface WelcomeBannerProps {
  /** Guest's first name */
  firstName: string;
  /** Called when banner is dismissed (to mark as shown) */
  onDismiss: () => void;
  /** Additional className for styling */
  className?: string;
}

/**
 * WelcomeBanner component.
 *
 * Shows a welcome message to guests after check-in.
 * Auto-dismisses after 8 seconds or on tap.
 */
export const WelcomeBanner: FC<WelcomeBannerProps> = memo(function WelcomeBanner({
  firstName,
  onDismiss,
  className = '',
}) {
  const { t } = useTranslation('PreArrival');
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    // Wait for animation to complete before calling onDismiss
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300);
  }, [onDismiss]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      onClick={handleDismiss}
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        bg-gradient-to-b from-primary-50/95 to-primary-100/95
        dark:from-primary-900/95 dark:to-primary-800/95
        backdrop-blur-sm
        transition-opacity duration-300
        ${isExiting ? 'opacity-0' : 'opacity-100'}
        cursor-pointer
        ${className}
      `}
    >
      <div
        className={`
          text-center px-8 py-12 max-w-sm
          transform transition-transform duration-300
          ${isExiting ? 'scale-95' : 'scale-100'}
        `}
      >
        {/* Welcome icon */}
        <div className="text-6xl mb-6">
          <span role="img" aria-label="celebration">
            {/* Using a simple wave emoji for universal appeal */}
          </span>
        </div>

        {/* Main welcome message */}
        <h1 className="text-3xl font-bold text-primary-900 dark:text-primary-50 mb-4">
          {t('welcome.title', { firstName })}
        </h1>

        {/* Sub-message */}
        <p className="text-lg text-primary-700 dark:text-primary-200 mb-8">
          {t('welcome.subtitle')}
        </p>

        {/* Quick tips or info */}
        <div className="space-y-2 text-sm text-primary-600 dark:text-primary-300">
          <p>{t('welcome.tip1')}</p>
          <p>{t('welcome.tip2')}</p>
        </div>

        {/* Tap to dismiss hint */}
        <p className="mt-8 text-xs text-primary-400 dark:text-primary-500 animate-pulse">
          {t('welcome.tapToDismiss')}
        </p>
      </div>
    </div>
  );
});

WelcomeBanner.displayName = 'WelcomeBanner';
export default WelcomeBanner;
