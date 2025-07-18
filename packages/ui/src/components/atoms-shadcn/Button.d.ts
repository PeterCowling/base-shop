import * as React from "react";
import type { ButtonProps as BaseButtonProps } from "../ui/button";
export interface ButtonProps extends Omit<BaseButtonProps, "variant"> {
    variant?: BaseButtonProps["variant"] | "destructive";
}
export declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
