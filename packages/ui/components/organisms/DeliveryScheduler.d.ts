import * as React from "react";
export interface DeliverySchedulerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    /** Callback fired whenever the user changes any field */
    onChange?: (info: {
        mode: "delivery" | "pickup";
        date: string;
        time: string;
    }) => void;
}
export declare function DeliveryScheduler({ className, onChange, ...props }: DeliverySchedulerProps): React.JSX.Element;
