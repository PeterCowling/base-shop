import * as React from "react";
export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Label for the form control */
    label: React.ReactNode;
    /** id of the form control this label describes */
    htmlFor?: string;
    /** Error message shown below the control */
    error?: React.ReactNode;
    /** Display asterisk after the label */
    required?: boolean;
    /** Optional width */
    width?: string | number;
    /** Optional height */
    height?: string | number;
    /** Optional padding classes */
    padding?: string;
    /** Optional margin classes */
    margin?: string;
}
export declare const FormField: React.ForwardRefExoticComponent<FormFieldProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=FormField.d.ts.map