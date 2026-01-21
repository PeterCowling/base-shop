import * as React from "react";
export interface PriceClusterProps extends React.HTMLAttributes<HTMLDivElement> {
    price: number;
    compare?: number;
    currency?: string;
}
/**
 * Display current price with optional compare-at price and discount badge.
 */
export declare const PriceCluster: React.ForwardRefExoticComponent<PriceClusterProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=PriceCluster.d.ts.map