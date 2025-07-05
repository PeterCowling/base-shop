import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/cn";
import { ProductBadge } from "../atoms/ProductBadge";
/**
 * Display a cluster of badges highlighting sustainability features.
 */
export const SustainabilityBadgeCluster = React.forwardRef(({ badges, className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn("flex flex-wrap gap-2", className), ...props, children: badges.map((b, idx) => (_jsx(ProductBadge, { label: b.label, variant: b.variant ?? "new" }, idx))) })));
SustainabilityBadgeCluster.displayName = "SustainabilityBadgeCluster";
