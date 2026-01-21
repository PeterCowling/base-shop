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
        "inline-flex items-center gap-2",
        className,
      )}
    >
      <input
        ref={ref}
        type="radio"
        className="accent-primary size-11"
        {...props}
      />
      {label ?? children}
    </label>
  )
);
Radio.displayName = "Radio";
