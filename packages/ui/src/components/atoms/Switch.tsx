import * as React from "react";
import { cn } from "../../utils/style";

export type SwitchProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => (
    <label
      className={cn(
        "relative inline-flex cursor-pointer items-center",
        className
      )}
    >
      <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
      <span
        className="bg-input peer-checked:bg-primary peer-focus:ring-ring peer-focus:ring-offset-background relative h-5 w-9 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-offset-2"
        data-token="--color-primary"
      >
        <span
          className="bg-input absolute top-0.5 left-0.5 h-4 w-4 rounded-full shadow transition-transform peer-checked:translate-x-4"
          data-token="--surface-input"
        />
      </span>
    </label>
  )
);
Switch.displayName = "Switch";
