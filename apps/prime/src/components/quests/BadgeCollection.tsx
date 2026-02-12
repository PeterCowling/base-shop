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
        <div className="flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1">
          <Trophy className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">{totalXp}</span>
        </div>

        {/* Badge count */}
        {badges.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              {badges.slice(0, 3).map((badgeId) => (
                <div
                  key={badgeId}
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-accent-soft"
                >
                  <BadgeIcon badgeId={badgeId} size="sm" className="text-accent" />
                </div>
              ))}
            </div>
            {badges.length > 3 && (
              <span className="text-xs text-muted-foreground">+{badges.length - 3}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full mode for account page
  return (
    <div className={`rounded-2xl bg-card p-4 shadow-sm ${className}`}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Award className="h-5 w-5 text-accent" />
          {t('account.badgesTitle')}
        </h3>
        <div className="flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1">
          <Trophy className="h-4 w-4 text-primary" />
          <span className="font-semibold text-primary">{totalXp}</span>
          <span className="text-xs text-primary">XP</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-accent-soft p-3 text-center">
          <div className="text-2xl font-bold text-accent">{badges.length}</div>
          <div className="text-xs text-accent">{t('account.badgesTitle')}</div>
        </div>
        <div className="rounded-xl bg-primary-soft p-3 text-center">
          <div className="text-2xl font-bold text-primary">{completedTiers.length}</div>
          <div className="text-xs text-primary">{t('account.questsCompleted')}</div>
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
                  ? 'bg-accent-soft'
                  : 'bg-muted opacity-50'
              }`}
            >
              {/* Badge icon */}
              <div
                className={`mb-2 flex h-12 w-12 items-center justify-center rounded-full ${
                  isEarned
                    ? 'bg-accent-soft shadow-sm'
                    : 'bg-muted'
                }`}
              >
                {isEarned ? (
                  <BadgeIcon badgeId={badge.id} size="lg" className="text-accent" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Badge name */}
              <span
                className={`text-center text-xs font-medium ${
                  isEarned ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {t(badge.nameKey)}
              </span>

              {/* XP value */}
              {tier && (
                <span
                  className={`mt-1 text-xs ${
                    isEarned ? 'text-accent' : 'text-muted-foreground'
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
