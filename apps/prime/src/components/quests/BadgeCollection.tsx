/**
 * BadgeCollection.tsx
 *
 * Displays the user's earned badges and total XP.
 * Used on the account page and optionally on the home screen.
 */

'use client';

import { type FC, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Lock, Trophy } from 'lucide-react';

import { BADGES, QUEST_TIERS } from '../../config/quests/questTiers';
import { useComputedQuestState } from '../../hooks/useComputedQuestState';

import BadgeIcon from './BadgeIcon';

interface BadgeCollectionProps {
  /** Display mode - compact for home, full for account */
  mode?: 'compact' | 'full';
  /** Additional class name */
  className?: string;
}

const BadgeCollection: FC<BadgeCollectionProps> = memo(function BadgeCollection({
  mode = 'full',
  className = '',
}) {
  const { t } = useTranslation('Quests');
  const { questState, isLoading } = useComputedQuestState();

  if (isLoading || !questState) {
    return null;
  }

  const { badges, totalXp, completedTiers } = questState;

  if (mode === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* XP display */}
        <div className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1">
          <Trophy className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-600">{totalXp}</span>
        </div>

        {/* Badge count */}
        {badges.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              {badges.slice(0, 3).map((badgeId) => (
                <div
                  key={badgeId}
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-amber-100"
                >
                  <BadgeIcon badgeId={badgeId} size="sm" className="text-amber-600" />
                </div>
              ))}
            </div>
            {badges.length > 3 && (
              <span className="text-xs text-gray-500">+{badges.length - 3}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full mode for account page
  return (
    <div className={`rounded-2xl bg-white p-4 shadow-sm ${className}`}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Award className="h-5 w-5 text-amber-500" />
          {t('account.badgesTitle')}
        </h3>
        <div className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1">
          <Trophy className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-blue-600">{totalXp}</span>
          <span className="text-xs text-blue-600">XP</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-amber-50 p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{badges.length}</div>
          <div className="text-xs text-amber-700">{t('account.badgesTitle')}</div>
        </div>
        <div className="rounded-xl bg-blue-50 p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{completedTiers.length}</div>
          <div className="text-xs text-blue-700">{t('account.questsCompleted')}</div>
        </div>
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-3 gap-3">
        {BADGES.map((badge) => {
          const isEarned = badges.includes(badge.id);
          const tier = QUEST_TIERS.find((t) => t.badge === badge.id);

          return (
            <div
              key={badge.id}
              className={`relative flex flex-col items-center rounded-xl p-3 transition-all ${
                isEarned
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50'
                  : 'bg-gray-50 opacity-50'
              }`}
            >
              {/* Badge icon */}
              <div
                className={`mb-2 flex h-12 w-12 items-center justify-center rounded-full ${
                  isEarned
                    ? 'bg-gradient-to-br from-amber-100 to-amber-200 shadow-sm'
                    : 'bg-gray-200'
                }`}
              >
                {isEarned ? (
                  <BadgeIcon badgeId={badge.id} size="lg" className="text-amber-600" />
                ) : (
                  <Lock className="h-5 w-5 text-gray-400" />
                )}
              </div>

              {/* Badge name */}
              <span
                className={`text-center text-xs font-medium ${
                  isEarned ? 'text-amber-900' : 'text-gray-500'
                }`}
              >
                {t(badge.nameKey)}
              </span>

              {/* XP value */}
              {tier && (
                <span
                  className={`mt-1 text-xs ${
                    isEarned ? 'text-amber-600' : 'text-gray-400'
                  }`}
                >
                  {tier.xpValue} XP
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default BadgeCollection;
