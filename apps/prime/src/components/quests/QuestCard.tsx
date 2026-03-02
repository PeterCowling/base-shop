/**
 * QuestCard.tsx
 *
 * Displays the current quest progress on the home screen.
 * Shows the active tier, progress bar, and next action to complete.
 */

'use client';

import { type FC, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, ChevronRight, Clock, Sparkles } from 'lucide-react';

import { getTierById } from '../../config/quests/questTiers';
import { useComputedQuestState } from '../../hooks/useComputedQuestState';

interface QuestCardProps {
  /** Optional class name for styling */
  className?: string;
}

const QuestCard: FC<QuestCardProps> = memo(function QuestCard({ className = '' }) {
  const { t } = useTranslation('Quests');
  const { questState, isLoading } = useComputedQuestState();

  // Don't render while loading
  if (isLoading || !questState) {
    return null;
  }

  // If all quests are complete, show completion state
  if (questState.allComplete) {
    return (
      <div className={`rounded-2xl bg-accent-soft p-4 shadow-sm ${className}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
            <Award className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              {t('labels.allComplete')}
            </h3>
            <p className="text-sm text-accent">
              {questState.totalXp} XP
            </p>
          </div>
          <div className="whitespace-nowrap">
            {questState.badges.slice(0, 3).map((badge) => (
              <div
                key={badge}
                className="first:ms-0 -ms-1 inline-block h-8 w-8 rounded-full border-2 border-card bg-accent-soft text-center"
              >
                <Sparkles className="mx-auto mt-1.5 h-4 w-4 text-accent" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Get active tier info
  const activeTierId = questState.activeTier;
  if (!activeTierId) return null;

  const activeTier = getTierById(activeTierId);
  const tierProgress = questState.tierProgress[activeTierId];

  if (!activeTier || !tierProgress) return null;

  // Determine next action display
  const { nextAction } = questState;
  let actionText = '';
  let actionIcon = <ChevronRight className="h-4 w-4" />;

  if (nextAction.type === 'complete-task' && nextAction.taskId) {
    // Get task-specific text from translations
    actionText = t(`tasks.${nextAction.taskId}`, { defaultValue: nextAction.taskId });
  } else if (nextAction.type === 'wait-for-unlock') {
    actionText = t('labels.lockedUntil', { hours: nextAction.hoursRemaining });
    actionIcon = <Clock className="h-4 w-4" />;
  }

  return (
    <div className={`rounded-2xl bg-primary-soft p-4 shadow-sm ${className}`}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-xs font-medium uppercase tracking-wide text-primary">
            {t('labels.currentQuest')}
          </span>
        </div>
        <span className="text-xs font-medium text-primary">
          {questState.totalXp} XP
        </span>
      </div>

      {/* Quest name */}
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {t(activeTier.nameKey)}
      </h3>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>
            {tierProgress.completedCount}/{tierProgress.totalCount} {t('labels.progress')}
          </span>
          <span>{tierProgress.percentage}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-primary-soft">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${tierProgress.percentage}%` }}
          />
        </div>
      </div>

      {/* Next action */}
      {actionText && (
        <div className="flex items-center justify-between rounded-lg bg-card/60 px-3 py-2">
          <span className="text-sm text-foreground">{actionText}</span>
          {actionIcon}
        </div>
      )}

      {/* Badges earned */}
      {questState.badges.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t('labels.badges')}:</span>
          <div className="whitespace-nowrap">
            {questState.badges.map((badge) => (
              <div
                key={badge}
                className="first:ms-0 -ms-1 inline-block h-6 w-6 rounded-full border-2 border-card bg-accent-soft text-center"
                title={t(`badges.${badge}.name`)}
              >
                <Sparkles className="mx-auto mt-1 h-3 w-3 text-accent" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default QuestCard;
