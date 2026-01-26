import * as React from "react";

export interface ProductBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    label: string;
    variant?: "default" | "sale" | "new";
}
export declare const ProductBadge: React.ForwardRefExoticComponent<ProductBadgeProps & React.RefAttributes<HTMLSpanElement>>;
//# sourceMappingURL=ProductBadge.d.ts.map