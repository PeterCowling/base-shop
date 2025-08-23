import * as React from "react";
export interface OrderStep {
    label: string;
    date?: string;
    complete?: boolean;
}
export interface OrderTrackingTimelineProps extends React.HTMLAttributes<HTMLOListElement> {
    steps?: OrderStep[];
    shippingSteps?: OrderStep[];
    returnSteps?: OrderStep[];
    trackingEnabled?: boolean;
    /** Tailwind vertical spacing utility like `space-y-6` */
    itemSpacing?: string;
}
/**
 * Vertical timeline showing progress of an order.
 * Steps usually come from carrier APIs (UPS, DHL, etc.) and may differ per
 * provider. Shops that disable tracking can omit this component entirely.
 */
export declare function OrderTrackingTimeline({ steps, shippingSteps, returnSteps, trackingEnabled, itemSpacing, className, ...props }: OrderTrackingTimelineProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=OrderTrackingTimeline.d.ts.map