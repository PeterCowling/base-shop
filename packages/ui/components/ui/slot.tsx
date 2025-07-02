import * as React from "react";

export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, ...props }, ref) => {
    if (React.isValidElement(children)) {
      return React.cloneElement(
        children as React.ReactElement<any>,
        {
          ...props,
          ref,
        } as any
      );
    }
    return null;
  }
);
Slot.displayName = "Slot";
