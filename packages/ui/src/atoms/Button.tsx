// Copied from src/components/ui/Button.tsx to localize atom source
/* -------------------------------------------------------------------------- */
/*  Tailwind-powered button (variant + size + asChild)                        */
/*  • Compatible with React 19 automatic JSX runtime                          */
/*  • Framework-mode friendly: no runtime CSS generation                      */
/* -------------------------------------------------------------------------- */

/* i18n-exempt file -- ABC-123 [ttl=2026-12-31] class names and internal variants are not user-facing */
import { cloneElement, ElementType, forwardRef, isValidElement, memo } from "react";

import type { ButtonProps, ButtonSize, ButtonVariant, SlotProps } from "@/types/button";

/** Tiny clsx clone (zero-dependency) */
const clsx = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(" ");

const composeClasses = ({ variant, size }: { variant: ButtonVariant; size: ButtonSize }) => {
  const base =
    "inline-flex items-center justify-center font-medium transition " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary " +
    "disabled:opacity-40 disabled:pointer-events-none dark:text-gray-800";

  const variants: Record<ButtonVariant, string> = {
    default: "bg-brand-secondary text-brand-text hover:bg-brand-primary/90",
    outline: "border border-brand-primary text-brand-primary hover:bg-brand-primary/10",
  };

  const sizes: Record<ButtonSize, string> = {
    default: "h-11 px-4 py-2 rounded-md text-sm",
    icon: "h-11 w-11 rounded-full",
  };

  return clsx(base, variants[variant], sizes[size]);
};

const Slot = forwardRef<HTMLElement, SlotProps>(function Slot({ children, ...props }, ref) {
  if (!isValidElement(children)) {
    return null;
  }

  return cloneElement(children, {
    ...props,
    className: clsx(children.props.className, props.className),
    ref,
  });
});

const ButtonInner = forwardRef<HTMLElement, ButtonProps>(function Button(
  { variant = "default", size = "default", asChild = false, className = "", ariaLabel, ...props },
  ref
) {
  const Comp: ElementType = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref as never}
      className={clsx(composeClasses({ variant, size }), className)}
      aria-label={ariaLabel}
      {...props}
    />
  );
});

export const Button = memo(ButtonInner);
Button.displayName = "Button";

export default Button;
