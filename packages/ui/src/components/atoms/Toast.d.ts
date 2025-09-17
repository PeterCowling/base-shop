import * as React from "react";
export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
    open: boolean;
    onClose?: () => void;
    message: string;
    variant?: "success" | "error";
}
export declare const Toast: React.ForwardRefExoticComponent<ToastProps & React.RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=Toast.d.ts.map