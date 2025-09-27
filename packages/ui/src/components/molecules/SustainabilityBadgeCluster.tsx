import * as React from "react";
import { cn } from "../../utils/style";
import { ProductBadge } from "../atoms/ProductBadge";

export interface SustainabilityBadge {
  label: string;
  variant?: React.ComponentProps<typeof ProductBadge>["variant"];
}

export interface SustainabilityBadgeClusterProps
  extends React.HTMLAttributes<HTMLDivElement> {
  badges: SustainabilityBadge[];
}

/**
 * Display a cluster of badges highlighting sustainability features.
 */
export const SustainabilityBadgeCluster = React.forwardRef<
  HTMLDivElement,
  SustainabilityBadgeClusterProps
>(({ badges, className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-wrap gap-2", /* i18n-exempt: class names */ className)} {...props}>
    {badges.map((b, idx) => (
      <ProductBadge key={idx} label={b.label} variant={b.variant ?? "new"} />
    ))}
  </div>
));
SustainabilityBadgeCluster.displayName = "SustainabilityBadgeCluster";
