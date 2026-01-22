import * as React from "react";

export interface FormFieldProps {
    id?: string;
    label?: React.ReactNode;
    description?: React.ReactNode;
    error?: React.ReactNode;
    required?: boolean;
    className?: string;
    input: React.ReactElement | ((args: {
        id: string;
        describedBy?: string;
        ariaInvalid?: boolean;
    }) => React.ReactNode);
}
/**
 * Lightweight form field wrapper to standardize label/description/error wiring.
 * Clones the provided input element and wires `id` and `aria-describedby`.
 */
export declare function FormField({ id, label, description, error, required, className, input, }: FormFieldProps): React.JSX.Element;
export default FormField;
