import React, { useMemo } from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
};
type ButtonVariant = NonNullable<ButtonProps["variant"]>;

const Button = React.memo(function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const classes = useMemo(() => {
    const base = [
      "inline-flex",
      "min-h-12",
      "items-center",
      "justify-center",
      "rounded-full",
      "px-5",
      "text-sm",
      "font-semibold",
      "tracking-wide",
      "transition",
      "focus-visible:focus-ring",
      "disabled:cursor-not-allowed",
      "disabled:opacity-60",
    ];
    const variants: Record<ButtonVariant, string[]> = {
      primary: ["bg-primary", "text-primary-foreground", "hover:bg-accent"],
      outline: [
        "border",
        "border-border-1",
        "text-foreground",
        "hover:border-primary/70",
        "hover:text-accent",
      ],
      ghost: ["text-foreground", "hover:text-accent"],
    };
    const variantClass = variants[variant];
    return [...base, ...variantClass, className].filter(Boolean).join(" ");
  }, [className, variant]);

  return <button {...props} className={classes} />;
});

export default Button;
