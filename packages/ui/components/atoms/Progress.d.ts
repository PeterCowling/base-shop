import * as React from "react";
export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    step: number;
    total?: number;
}
export declare const Progress: React.ForwardRefExoticComponent<ProgressProps & React.RefAttributes<HTMLDivElement>>;
