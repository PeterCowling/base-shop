import type { CartState } from "@acme/platform-core/cart";
import * as React from "react";
export interface CartTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    cart: CartState;
    onQtyChange?: (id: string, qty: number) => void;
    onRemove?: (id: string) => void;
}
export declare function CartTemplate({ cart, onQtyChange, onRemove, className, ...props }: CartTemplateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=CartTemplate.d.ts.map