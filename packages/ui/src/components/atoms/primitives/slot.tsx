import * as React from "react";
import clsx from "clsx";

export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, ...props }, ref) => {
    if (React.isValidElement(children)) {
      const childProps =
        children.props as React.HTMLAttributes<HTMLElement>;
      return React.cloneElement(
        children as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
        {
          ...props,
          ...childProps,
          className: clsx(props.className, childProps.className),
          ref,
        } as React.HTMLAttributes<HTMLElement> & {
          ref: React.Ref<HTMLElement>;
        }
      );
    }
    return null;
  }
);
Slot.displayName = "Slot";
