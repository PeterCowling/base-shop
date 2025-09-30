import * as React from "react";
import { cn } from "../../utils/style";

export interface RadioProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, children, ...props }, ref) => (
    <label
      className={cn(
        // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
        "inline-flex items-center gap-2",
        className,
      )}
    >
      <input
        ref={ref}
        type="radio"
        // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
        className="accent-primary h-10 w-10"
        {...props}
      />
      {label ?? children}
    </label>
  )
);
Radio.displayName = "Radio"; // i18n-exempt -- DS-1234 [ttl=2025-11-30] — component displayName, not user-facing
