import * as React from "react";
import { cn } from "../../utils/style";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  step: number;
  total?: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ step, total = 4, className, ...props }, ref) => {
    const percent = ((step + 1) / total) * 100;
    return (
      <div ref={ref} className={cn("space-y-1", className)} {...props}>
        <div className="bg-muted h-2 w-full overflow-hidden rounded">
          <div
            className="bg-primary h-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="text-muted-foreground text-right text-sm">
          Step {step + 1} of {total}
        </div>
      </div>
    );
  }
);
Progress.displayName = "Progress";
