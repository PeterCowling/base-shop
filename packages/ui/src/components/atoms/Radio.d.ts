import * as React from "react";
export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: React.ReactNode;
}
export declare const Radio: React.ForwardRefExoticComponent<RadioProps & React.RefAttributes<HTMLInputElement>>;
