/* File: /src/components/onboarding/ProgressBar.tsx */
import { FC, memo } from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

/**
 * ProgressBar
 * Displays a simple horizontal bar indicating the user's progress through
 * the onboarding flow. Percentage is derived from (currentStep / totalSteps).
 * Memoised to avoid unnecessary re‑renders.
 */
const ProgressBar: FC<ProgressBarProps> = memo(function ProgressBar({
  currentStep,
  totalSteps,
}) {
  const percentage = Math.min(
    100,
    Math.round((currentStep / totalSteps) * 100),
  );

  return (
    <div className="w-full bg-gray-300 rounded-full h-2 mb-4">
      <div
        className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';
export default ProgressBar;
