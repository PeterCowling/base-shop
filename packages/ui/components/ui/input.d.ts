import * as React from "react";
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /** Optional label displayed above or floating */
    label?: React.ReactNode;
    /** Error message shown below the control */
    error?: React.ReactNode;
    /** Enable floating label style */
    floatingLabel?: boolean;
    /** Class applied to the wrapper element */
    wrapperClassName?: string;
}
export declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;
