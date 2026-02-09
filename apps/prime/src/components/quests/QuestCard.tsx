/**
 * QuestCard.tsx
 *
 * Displays the current quest progress on the home screen.
 * Shows the active tier, progress bar, and next action to complete.
 */

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
      <div className={`rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm ${className}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Award className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900">
              {t('labels.allComplete')}
            </h3>
            <p className="text-sm text-amber-700">
              {questState.totalXp} XP
            </p>
          </div>
          <div className="flex -space-x-1">
            {questState.badges.slice(0, 3).map((badge) => (
              <div
                key={badge}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-amber-200"
              >
                <Sparkles className="h-4 w-4 text-amber-600" />
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
    <div className={`rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm ${className}`}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <span className="text-xs font-medium uppercase tracking-wide text-blue-600">
            {t('labels.currentQuest')}
          </span>
        </div>
        <span className="text-xs font-medium text-blue-600">
          {questState.totalXp} XP
        </span>
      </div>

      {/* Quest name */}
      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        {t(activeTier.nameKey)}
      </h3>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="mb-1 flex justify-between text-xs text-gray-500">
          <span>
            {tierProgress.completedCount}/{tierProgress.totalCount} {t('labels.progress')}
          </span>
          <span>{tierProgress.percentage}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-blue-100">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${tierProgress.percentage}%` }}
          />
        </div>
      </div>

      {/* Next action */}
      {actionText && (
        <div className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2">
          <span className="text-sm text-gray-700">{actionText}</span>
          {actionIcon}
        </div>
      )}

      {/* Badges earned */}
      {questState.badges.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-gray-500">{t('labels.badges')}:</span>
          <div className="flex -space-x-1">
            {questState.badges.map((badge) => (
              <div
                key={badge}
                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-amber-100"
                title={t(`badges.${badge}.name`)}
              >
                <Sparkles className="h-3 w-3 text-amber-600" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default QuestCard;
