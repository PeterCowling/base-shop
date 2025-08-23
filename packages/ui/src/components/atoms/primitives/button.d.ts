import * as React from "react";
type ButtonVariant = "default" | "outline" | "ghost" | "destructive";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    asChild?: boolean;
}
export declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
export {};
//# sourceMappingURL=button.d.ts.map