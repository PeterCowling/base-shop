import * as React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** Optional label displayed above or floating */
    label?: React.ReactNode;
    /** Error message shown below the control */
    error?: React.ReactNode;
    /** Optional helper/description text */
    description?: React.ReactNode;
    /** Enable floating label style */
    floatingLabel?: boolean;
    /** Class applied to the wrapper element */
    wrapperClassName?: string;
}
export declare const Textarea: React.ForwardRefExoticComponent<TextareaProps & React.RefAttributes<HTMLTextAreaElement>>;
