import type { ButtonHTMLAttributes } from "react";
import React from "react";

import { Button as BaseButton } from "./Button";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
}

/**
 * IconButton — focuses on hit target and accessibility.
 * Enforces size="icon" via underlying Button and requires aria-label.
 */
export const IconButton: React.FC<IconButtonProps> = ({ children, "aria-label": ariaLabel, ...rest }) => {
  return (
    <BaseButton size="icon" ariaLabel={ariaLabel} {...rest}>
      {children}
    </BaseButton>
  );
};

export default IconButton;
