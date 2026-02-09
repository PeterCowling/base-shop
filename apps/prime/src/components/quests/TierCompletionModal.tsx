/**
 * TierCompletionModal.tsx
 *
 * Displays a celebration modal when a quest tier is completed.
 * Shows the badge earned, XP gained, and a CSS-only confetti animation.
 */

'use client';

import { type FC, memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, X } from 'lucide-react';

import { getBadgeById,getTierById } from '../../config/quests/questTiers';

import BadgeIcon from './BadgeIcon';

interface TierCompletionModalProps {
  /** The tier ID that was just completed */
  tierId: string;
  /** Callback when modal is closed */
  onClose: () => void;
}

const TierCompletionModal: FC<TierCompletionModalProps> = memo(function TierCompletionModal({
  tierId,
  onClose,
}) {
  const { t } = useTranslation('Quests');
  const [showConfetti, setShowConfetti] = useState(false);

  const tier = getTierById(tierId);
  const badge = tier ? getBadgeById(tier.badge) : null;

  // Trigger confetti animation after mount
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-close after 5 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!tier || !badge) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* CSS-only confetti */}
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                '--delay': `${Math.random() * 3}s`,
                '--x': `${Math.random() * 100}vw`,
                '--rotation': `${Math.random() * 360}deg`,
                '--color': ['#fbbf24', '#60a5fa', '#34d399', '#f87171', '#a78bfa'][
                  Math.floor(Math.random() * 5)
                ],
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Modal content */}
      <div className="relative z-10 mx-4 w-full max-w-sm animate-bounce-in rounded-2xl bg-white p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Badge animation */}
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <div className="animate-pulse-slow flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 shadow-lg">
              <BadgeIcon badgeId={tier.badge} size="lg" className="text-amber-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white shadow-md">
              <Award className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="mb-2 text-center text-xl font-bold text-gray-900">
          {t('completion.title')}
        </h2>

        {/* Tier name */}
        <p className="mb-4 text-center text-gray-600">
          {t(tier.nameKey)}
        </p>

        {/* Badge earned */}
        <div className="mb-4 rounded-xl bg-amber-50 p-4">
          <div className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-amber-600">
            {t('completion.badgeEarned')}
          </div>
          <div className="text-center">
            <span className="text-lg font-semibold text-amber-900">
              {t(badge.nameKey)}
            </span>
          </div>
          <p className="mt-1 text-center text-sm text-amber-700">
            {t(badge.descriptionKey)}
          </p>
        </div>

        {/* XP earned */}
        <div className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 p-3">
          <span className="text-2xl font-bold text-blue-600">+{tier.xpValue}</span>
          <span className="text-sm font-medium text-blue-600">XP</span>
        </div>

        {/* Continue button */}
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
        >
          {t('completion.continue')}
        </button>
      </div>

      {/* Confetti styles */}
      <style jsx>{`
        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 10px;
          background: var(--color);
          top: -10px;
          left: var(--x);
          opacity: 0;
          animation: confetti-fall 3s ease-out var(--delay) forwards;
        }

        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) rotate(var(--rotation));
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
});

export default TierCompletionModal;
