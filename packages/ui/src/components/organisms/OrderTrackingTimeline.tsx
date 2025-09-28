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
      className={cn("relative border-s ps-4", itemSpacing, className)} // i18n-exempt -- UI-000 CSS utility classes only [ttl=2025-12-31]
      {...props}
    >
      {merged.map((step) => (
        <li
          key={`${step.label}-${step.date ?? ""}-${step.complete ? "1" : "0"}`}
          className="ms-6"
        >
          <span
            className={cn(
              "absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full border", // i18n-exempt -- UI-000 CSS utility classes only [ttl=2025-12-31]
              step.complete
                ? "bg-primary text-primary-foreground" // i18n-exempt -- UI-000 CSS utility classes only [ttl=2025-12-31]
                : "bg-muted text-muted-foreground" // i18n-exempt -- UI-000 CSS utility classes only [ttl=2025-12-31]
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
