import * as React from "react";

import { cn } from "../../utils/style";

export interface RadioProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
}

export function Radio({ className, label, children, ref, ...props }: RadioProps & { ref?: React.Ref<HTMLInputElement> }) {
  return (
    <label
      data-slot="radio"
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
  );
}
