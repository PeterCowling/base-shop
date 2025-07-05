import * as React from "react";
export interface OrderStep {
    label: string;
    date?: string;
    complete?: boolean;
}
export interface OrderTrackingTimelineProps extends React.HTMLAttributes<HTMLOListElement> {
    steps: OrderStep[];
    /** Tailwind vertical spacing utility like `space-y-6` */
    itemSpacing?: string;
}
/**
 * Vertical timeline showing progress of an order.
 */
export declare function OrderTrackingTimeline({ steps, itemSpacing, className, ...props }: OrderTrackingTimelineProps): import("react/jsx-runtime").JSX.Element;
