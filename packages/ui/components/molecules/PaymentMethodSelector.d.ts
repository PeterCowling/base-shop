import * as React from "react";
export interface PaymentMethod {
    value: string;
    label: string;
    icon?: React.ReactNode;
}
export interface PaymentMethodSelectorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    methods: PaymentMethod[];
    value?: string;
    onChange?: (value: string) => void;
}
/**
 * Radio-group style selector for choosing a payment method.
 */
export declare function PaymentMethodSelector({ methods, value, onChange, className, ...props }: PaymentMethodSelectorProps): React.JSX.Element;
export declare namespace PaymentMethodSelector {
    var displayName: string;
}
