import * as React from "react";
export interface QuantityInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
    value: number;
    min?: number;
    max?: number;
    onChange?: (value: number) => void;
}
/**
 * Numeric input with increment/decrement buttons.
 */
export declare const QuantityInput: React.ForwardRefExoticComponent<QuantityInputProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=QuantityInput.d.ts.map