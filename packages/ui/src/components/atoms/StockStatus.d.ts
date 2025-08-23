import * as React from "react";
export interface StockStatusProps extends React.HTMLAttributes<HTMLSpanElement> {
    inStock: boolean;
    labelInStock?: string;
    labelOutOfStock?: string;
}
export declare const StockStatus: React.ForwardRefExoticComponent<StockStatusProps & React.RefAttributes<HTMLSpanElement>>;
//# sourceMappingURL=StockStatus.d.ts.map