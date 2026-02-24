import * as React from "react";

import { cn } from "../../utils/style";

export type ElevatedPanelProps = React.HTMLAttributes<HTMLElement>;

export function ElevatedPanel({ className, ...props }: ElevatedPanelProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border-2 bg-surface p-6 shadow-elevation-1",
        className,
      )}
      {...props}
    />
  );
}

