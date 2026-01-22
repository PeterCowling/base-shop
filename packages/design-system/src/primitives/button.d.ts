import * as React from "react";

type LegacyVariant = "default" | "outline" | "ghost" | "destructive";
type ButtonTone = "solid" | "soft" | "outline" | "ghost" | "quiet";
type ButtonColor = "default" | "primary" | "accent" | "success" | "info" | "warning" | "danger";
type ButtonSize = "sm" | "md" | "lg";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /**
     * Legacy variant prop maintained for back-compat (default/outline/ghost/destructive).
     * Prefer using `color` + `tone` for new code.
     */
    variant?: LegacyVariant;
    /** Semantic color intent (default maps to neutral/muted). */
    color?: ButtonColor;
    /** Visual tone for the button. */
    tone?: ButtonTone;
    /** Optional leading icon node */
    leadingIcon?: React.ReactNode;
    /** Optional trailing icon node */
    trailingIcon?: React.ReactNode;
    /** Icon size utility: sm=14px, md=16px, lg=20px (default: md) */
    iconSize?: "sm" | "md" | "lg";
    /** Render as square icon-only button (provide aria-label). */
    iconOnly?: boolean;
    asChild?: boolean;
    /** Size scale for padding/height/typography. */
    size?: ButtonSize;
}
export declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
export {};
