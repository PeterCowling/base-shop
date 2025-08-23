import * as React from "react";
import type { OrderStep } from "../organisms/OrderTrackingTimeline";
export interface OrderTrackingTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    orderId: string;
    steps: OrderStep[];
    /** Optional shipping address to display */
    address?: string;
}
export declare function OrderTrackingTemplate({ orderId, steps, address, className, ...props }: OrderTrackingTemplateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=OrderTrackingTemplate.d.ts.map