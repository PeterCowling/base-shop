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
  steps?: OrderStep[];
  shippingSteps?: OrderStep[];
  returnSteps?: OrderStep[];
  trackingEnabled?: boolean;
  /** Tailwind vertical spacing utility like `space-y-6` */
  itemSpacing?: string;
}

/**
 * Vertical timeline showing progress of an order.
 * Steps usually come from carrier APIs (UPS, DHL, etc.) and may differ per
 * provider. Shops that disable tracking can omit this component entirely.
 */
export function OrderTrackingTimeline({
  steps,
  shippingSteps = [],
  returnSteps = [],
  trackingEnabled = true,
  itemSpacing = "space-y-6",
  className,
  ...props
}: OrderTrackingTimelineProps) {
  if (!trackingEnabled) return null;
  const merged = steps ?? [...shippingSteps, ...returnSteps];
  if (merged.length === 0) return null;
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
