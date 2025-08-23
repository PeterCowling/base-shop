import * as React from "react";
import { ProductBadge } from "../atoms/ProductBadge";
export interface SustainabilityBadge {
    label: string;
    variant?: React.ComponentProps<typeof ProductBadge>["variant"];
}
export interface SustainabilityBadgeClusterProps extends React.HTMLAttributes<HTMLDivElement> {
    badges: SustainabilityBadge[];
}
/**
 * Display a cluster of badges highlighting sustainability features.
 */
export declare const SustainabilityBadgeCluster: React.ForwardRefExoticComponent<SustainabilityBadgeClusterProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=SustainabilityBadgeCluster.d.ts.map