import type { CartState } from "@acme/types";
import * as React from "react";
export interface OrderConfirmationTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    orderId: string;
    cart: CartState;
}
export declare function OrderConfirmationTemplate({ orderId, cart, className, ...props }: OrderConfirmationTemplateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=OrderConfirmationTemplate.d.ts.map