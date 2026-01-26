import * as React from "react";

export interface RatingSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
    rating: number;
    count?: number;
}
/**
 * Display average rating and optional review count.
 */
export declare const RatingSummary: React.ForwardRefExoticComponent<RatingSummaryProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=RatingSummary.d.ts.map