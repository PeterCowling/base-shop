import * as React from "react";
import { cn } from "../../utils/style";

export type SwitchProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => (
    <label
      className={cn(
        // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
        "relative inline-flex cursor-pointer items-center",
        className
      )}
    >
      <span className="relative">
        <input
          ref={ref}
          type="checkbox"
          // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
          className="peer absolute h-10 w-10 opacity-0"
          {...props}
        />
      </span>
      <span
        // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
        className="bg-input peer-checked:bg-primary focus-visible:peer-focus:ring-ring focus-visible:peer-focus:ring-offset-background relative h-5 w-9 rounded-full transition-colors focus-visible:peer-focus:ring-2 focus-visible:peer-focus:ring-offset-2"
        // i18n-exempt -- DS-1234 [ttl=2025-11-30] — design token attribute, not user copy
        data-token="--color-primary"
      >
        <span
          // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
          className="bg-input absolute top-0.5 ms-0.5 h-4 w-4 rounded-full shadow transition-transform peer-checked:translate-x-4"
          // i18n-exempt -- DS-1234 [ttl=2025-11-30] — design token attribute, not user copy
          data-token="--surface-input"
        />
      </span>
    </label>
  )
);
Switch.displayName = "Switch";
