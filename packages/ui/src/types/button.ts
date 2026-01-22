// src/types/button.ts
// -----------------------------------------------------------------------------
// Centralised <Button> component string literals and prop types.
// -----------------------------------------------------------------------------
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactElement,
} from "react";

export type ButtonVariant = "default" | "outline" | "ghost" | "secondary" | "destructive";
export type ButtonSize = "default" | "icon" | "sm" | "lg";

export interface ButtonSharedProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  className?: string;
  /** Accessible label for icon-only buttons */
  ariaLabel?: string;
}

export type ButtonProps = ButtonSharedProps & ButtonHTMLAttributes<HTMLButtonElement>;

export type FlexibleProps = { className?: string; [key: string]: unknown };

export interface SlotProps extends HTMLAttributes<HTMLElement> {
  children: ReactElement<FlexibleProps>;
}
