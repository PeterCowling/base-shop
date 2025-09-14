import * as React from "react";
import clsx from "clsx";

export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, ...props }, ref) => {
    if (React.isValidElement(children)) {
      interface MergedProps extends React.HTMLAttributes<HTMLElement> {
        ref?: React.Ref<HTMLElement>;
      }

      const { ref: childRef, ...childProps } =
        children.props as MergedProps;

      const merged: MergedProps = {
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
      };

      return React.cloneElement(
        children as React.ReactElement<MergedProps>,
        merged,
      );
    }
    return null;
  }
);
Slot.displayName = "Slot";
