import React, { type ElementType } from "react";
import clsx from "clsx";

export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLElement> {
  as?: keyof JSX.IntrinsicElements;
}

/**
 * VisuallyHidden — renders content only for assistive technologies
 */
export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ as = "span", className, children, ...rest }) => {
  const Comp = as as ElementType;
  return (
    <Comp className={clsx("sr-only", className)} {...rest}>
      {children}
    </Comp>
  );
};

export default VisuallyHidden;
