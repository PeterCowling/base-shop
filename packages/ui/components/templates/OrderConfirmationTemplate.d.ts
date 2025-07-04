import type { CartState } from "@types";
import * as React from "react";
export interface OrderConfirmationTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    orderId: string;
    cart: CartState;
}
export declare function OrderConfirmationTemplate({ orderId, cart, className, ...props }: OrderConfirmationTemplateProps): React.JSX.Element;
