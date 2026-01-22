import { type FC } from "react";

interface StepProgressProps {
  step: number;
  onStepChange: (n: number) => void;
  userName?: string;
}

const labels = ["Cash", "Receipts", "Keycards"];

const StepProgress: FC<StepProgressProps> = ({ step, onStepChange, userName }) => {
  const isPete = userName?.toLowerCase() === "pete";

  const handleClick = (index: number) => {
    if (index < step || (isPete && index > step)) {
      onStepChange(index);
    }
  };

  return (
    <ol className="flex justify-between mb-4" aria-label="Closing progress">
      {labels.map((label, index) => {
        const active = index === step;
        const clickable = index < step || (isPete && index > step);
        return (
          <li key={label} className="flex flex-1 flex-col items-center">
            <button
              type="button"
              onClick={() => handleClick(index)}
              disabled={!clickable}
              aria-current={active ? 'step' : undefined}
              className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                active
                  ? 'bg-primary-main text-white dark:bg-darkAccentGreen'
                  : 'bg-gray-200 text-gray-600 dark:bg-darkSurface dark:text-darkAccentGreen'
              } ${clickable ? 'hover:bg-primary-light' : 'cursor-default'}`}
            >
              {index + 1}
            </button>
            <span className="text-xs mt-1 dark:text-darkAccentGreen">{label}</span>
          </li>
        );
      })}
    </ol>
  );
};

export default StepProgress;
