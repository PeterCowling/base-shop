// src/types/button.ts
// -----------------------------------------------------------------------------
// Centralised <Button> component string literals and prop types.
// -----------------------------------------------------------------------------
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactElement,
} from "react";

export type ButtonVariant = "default" | "outline";
export type ButtonSize = "default" | "icon";

export interface ButtonSharedProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  className?: string;
  /** Accessible label for icon-only buttons */
  ariaLabel?: string;
}

export type ButtonProps = ButtonSharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement>;

export type FlexibleProps = { className?: string; [key: string]: unknown };

export interface SlotProps extends HTMLAttributes<HTMLElement> {
  children: ReactElement<FlexibleProps>;
}
