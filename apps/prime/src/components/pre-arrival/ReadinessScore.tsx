/**
 * ReadinessScore.tsx
 *
 * Circular progress indicator showing the guest's pre-arrival readiness score.
 * Score is computed from checklist progress (0-100).
 */

import { CheckCircle2 } from 'lucide-react';
import { FC, memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReadinessLevel } from '../../lib/preArrival';

interface ReadinessScoreProps {
  /** Score from 0-100 */
  score: number;
  /** Readiness level for styling */
  level: ReadinessLevel;
  /** Optional class name */
  className?: string;
}

/**
 * Get gradient colors based on readiness level.
 */
function getLevelColors(level: ReadinessLevel): {
  ring: string;
  text: string;
  bg: string;
} {
  switch (level) {
    case 'not-started':
      return {
        ring: 'stroke-gray-300',
        text: 'text-gray-600',
        bg: 'bg-gray-50',
      };
    case 'in-progress':
      return {
        ring: 'stroke-blue-500',
        text: 'text-blue-600',
        bg: 'bg-blue-50',
      };
    case 'almost-ready':
      return {
        ring: 'stroke-amber-500',
        text: 'text-amber-600',
        bg: 'bg-amber-50',
      };
    case 'ready':
      return {
        ring: 'stroke-green-500',
        text: 'text-green-600',
        bg: 'bg-green-50',
      };
    default:
      return {
        ring: 'stroke-gray-300',
        text: 'text-gray-600',
        bg: 'bg-gray-50',
      };
  }
}

export const ReadinessScore: FC<ReadinessScoreProps> = memo(function ReadinessScore({
  score,
  level,
  className = '',
}) {
  const { t } = useTranslation('PreArrival');
  const colors = getLevelColors(level);

  // SVG circle calculation
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Show checkmark when fully ready
  const isComplete = score === 100;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={`transition-all duration-500 ${colors.ring}`}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isComplete ? (
            <CheckCircle2 className={`h-10 w-10 ${colors.text}`} />
          ) : (
            <>
              <span className={`text-3xl font-bold ${colors.text}`}>
                {score}%
              </span>
              <span className="text-xs text-gray-500">
                {t('readiness.score')}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Status label */}
      <div className={`mt-3 rounded-full px-3 py-1 ${colors.bg}`}>
        <span className={`text-sm font-medium ${colors.text}`}>
          {t(`readiness.status.${level}`)}
        </span>
      </div>
    </div>
  );
});

export default ReadinessScore;
