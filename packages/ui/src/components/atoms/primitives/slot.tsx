import * as React from "react";
import clsx from "clsx";

export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, ...props }, ref) => {
    if (React.isValidElement(children)) {
      const { ref: childRef, ...childProps } =
        children.props as React.HTMLAttributes<HTMLElement> & {
          ref?: React.Ref<HTMLElement>;
        };

      return React.cloneElement(
        children as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
        {
          ...props,
          ...childProps,
          className: clsx(props.className, childProps.className),
          ref: (node: HTMLElement | null) => {
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLElement | null>).current = node;
            }
            if (typeof childRef === "function") {
              childRef(node);
            } else if (childRef) {
              (
                childRef as React.MutableRefObject<HTMLElement | null>
              ).current = node;
            }
          },
        } as any,
      );
    }
    return null;
  }
);
Slot.displayName = "Slot";
