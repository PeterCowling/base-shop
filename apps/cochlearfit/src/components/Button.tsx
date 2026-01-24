import React from "react";

import { Button as DSButton } from "@acme/design-system/primitives";

type ButtonVariant = "primary" | "outline" | "ghost";

type ButtonProps = Omit<React.ComponentProps<typeof DSButton>, "color" | "tone" | "variant"> & {
  variant?: ButtonVariant;
};

const VARIANT_MAP: Record<ButtonVariant, { color: "primary"; tone: "solid" | "outline" | "ghost" }> = {
  primary: { color: "primary", tone: "solid" },
  outline: { color: "primary", tone: "outline" },
  ghost: { color: "primary", tone: "ghost" },
};

const Button = React.memo(function Button({ variant = "primary", ...props }: ButtonProps) {
  const { color, tone } = VARIANT_MAP[variant];
  return <DSButton {...props} color={color} tone={tone} />;
});

export default Button;
