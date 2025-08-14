import { CheckIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { cn } from "../../utils/style";

export interface OrderStep {
  label: string;
  date?: string;
  complete?: boolean;
}

export interface OrderTrackingTimelineProps
  extends React.HTMLAttributes<HTMLOListElement> {
  /**
   * Pre-combined steps if already merged.
   * Deprecated: use `shippingSteps` and `returnSteps` instead.
   */
  steps?: OrderStep[];
  /** Shipping-related tracking events */
  shippingSteps?: OrderStep[];
  /** Return-related tracking events */
  returnSteps?: OrderStep[];
  /** Tailwind vertical spacing utility like `space-y-6` */
  itemSpacing?: string;
}

/**
 * Vertical timeline showing progress of an order.
 */
export function OrderTrackingTimeline({
  steps = [],
  shippingSteps = [],
  returnSteps = [],
  itemSpacing = "space-y-6",
  className,
  ...props
}: OrderTrackingTimelineProps) {
  const merged = React.useMemo(() => {
    return [...steps, ...shippingSteps, ...returnSteps].sort((a, b) => {
      const aTime = a.date ? Date.parse(a.date) : 0;
      const bTime = b.date ? Date.parse(b.date) : 0;
      return aTime - bTime;
    });
  }, [steps, shippingSteps, returnSteps]);

  return (
    <ol
      className={cn("relative border-l pl-4", itemSpacing, className)}
      {...props}
    >
      {merged.map((step, idx) => (
        <li key={idx} className="ml-6">
          <span
            className={cn(
              "absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full border",
              step.complete
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {step.complete && <CheckIcon className="h-4 w-4" />}
          </span>
          <p className="font-medium">{step.label}</p>
          {step.date && (
            <time className="block text-sm text-muted">{step.date}</time>
          )}
        </li>
      ))}
    </ol>
  );
}
