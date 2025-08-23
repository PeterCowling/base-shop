import * as React from "react";
export interface PriceProps extends React.HTMLAttributes<HTMLSpanElement> {
    amount: number;
    currency?: string;
}
/**
 * Display formatted price. Uses selected currency from context when none is provided.
 */
export declare const Price: React.ForwardRefExoticComponent<PriceProps & React.RefAttributes<HTMLSpanElement>>;
//# sourceMappingURL=Price.d.ts.map