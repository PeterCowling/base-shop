import * as React from "react";
export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
    open: boolean;
    onClose?: () => void;
    message: string;
}
export declare const Toast: React.ForwardRefExoticComponent<ToastProps & React.RefAttributes<HTMLDivElement>>;
