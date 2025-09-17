import * as React from "react";
export type ToastVariant = "info" | "success" | "error";
export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
    open: boolean;
    onClose?: () => void;
    message: string;
    variant?: ToastVariant;
}
export declare const Toast: React.ForwardRefExoticComponent<ToastProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Toast.d.ts.map