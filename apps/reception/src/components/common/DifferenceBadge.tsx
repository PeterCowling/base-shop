import { memo } from "react";

export interface DifferenceBadgeProps {
  value: number;
  className?: string;
  positiveClassName?: string;
  negativeClassName?: string;
}

export const DifferenceBadge = memo(function DifferenceBadge({
  value,
  className = "",
  positiveClassName = "bg-success-main text-white dark:bg-darkAccentGreen dark:text-darkBg",
  negativeClassName = "bg-error-main text-white dark:bg-darkAccentOrange dark:text-darkSurface",
}: DifferenceBadgeProps) {
  const isPositive = value >= 0;
  const display = Number.isInteger(value)
    ? Math.abs(value).toString()
    : Math.abs(value).toFixed(2);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
        isPositive ? positiveClassName : negativeClassName
      } ${className}`.trim()}
    >
      {isPositive ? "+" : "-"}
      {display}
    </span>
  );
});

export default DifferenceBadge;
