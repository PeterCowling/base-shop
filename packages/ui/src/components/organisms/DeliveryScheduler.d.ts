import * as React from "react";
export interface DeliverySchedulerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    /** Callback fired whenever the user changes any field */
    onChange?: (info: {
        mode: "delivery" | "pickup";
        date: string;
        region?: string;
        window?: string;
    }) => void;
    /** Optional regions eligible for premier delivery */
    regions?: string[];
    /** Optional preset windows (e.g. `10-11`, `11-12`) */
    windows?: string[];
}
export declare function DeliveryScheduler({ className, onChange, regions, windows, ...props }: DeliverySchedulerProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=DeliveryScheduler.d.ts.map