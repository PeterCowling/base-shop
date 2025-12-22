import * as React from "react";
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Elevate surface to surface-3 and stronger shadow */
    elevated?: boolean;
}
export declare const Card: React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>;
export declare const CardContent: React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>;
