"use client";

import * as React from "react";
import clsx from "clsx";

export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

interface MergedProps extends React.HTMLAttributes<HTMLElement> {
  ref?: React.Ref<HTMLElement>;
}

export function Slot(
  {
    ref,
    children,
    ...props
  }: SlotProps & {
    ref?: React.Ref<HTMLElement>;
  }
): React.ReactElement | null {
  const isValid = React.isValidElement(children);

  let childRef: React.Ref<HTMLElement> | undefined;
  let childProps = {} as MergedProps;
  if (isValid) {
    const { ref: cRef, ...cProps } = (children as React.ReactElement<MergedProps>)
      .props as MergedProps;
    childRef = cRef;
    childProps = cProps;
  }

  // Create a stable ref setter to avoid ref attach/detach thrash loops
  const setMergedRef = React.useCallback(
    (node: HTMLElement | null) => {
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
    [ref, childRef]
  );

  const merged: MergedProps = {
    ...props,
    ...childProps,
    className: clsx(props.className, childProps.className),
    ref: setMergedRef,
  };

  if (!isValid) return null;
  return React.cloneElement(
    children as React.ReactElement<MergedProps>,
    merged
  );
}
