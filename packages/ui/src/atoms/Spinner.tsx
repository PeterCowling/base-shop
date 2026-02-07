// Copied from src/components/ui/Spinner.tsx
import { type FC, memo, useMemo } from "react";
import clsx from "clsx";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  size?: "sm" | "md" | "lg";
}

const Spinner: FC<SpinnerProps> = ({ label = "loading", size = "md", className, ...rest }) => {
  const dimensions = useMemo(() => {
    switch (size) {
      case "sm":
        return "h-4 w-4";
      case "lg":
        return "h-8 w-8";
      case "md":
      default:
        return "h-6 w-6";
    }
  }, [size]);

  return (
    <div
      role="status"
      aria-label={label}
      className={clsx(
        /* i18n-exempt -- ABC-123 [ttl=2026-12-31] layout classes */
        "inline-flex items-center justify-center",
        className
      )}
      {...rest}
    >
      <svg className={clsx("animate-spin motion-reduce:animate-none", dimensions)} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path className="opacity-75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default memo(Spinner);
