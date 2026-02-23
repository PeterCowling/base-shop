import * as React from "react";

import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "../primitives/shape-radius";
import { cn } from "../utils/style";

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Semantic control shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit radius token override. */
  radius?: PrimitiveRadius;
}

export const Switch = (
  {
    ref,
    className,
    shape,
    radius,
    ...props
  }: SwitchProps & {
    ref?: React.Ref<HTMLInputElement>;
  }
) => {
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "full",
  });

  return (
    <label
      className={cn(
        // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
        "relative inline-flex cursor-pointer items-center",
        className
      )}
    >
      <span className="relative">
        <input
          ref={ref}
          type="checkbox"
          // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
          className="peer absolute size-11 opacity-0"
          {...props}
        />
      </span>
      <span
        // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
        className={cn(
          "bg-input peer-checked:bg-primary focus-visible:peer-focus:ring-ring focus-visible:peer-focus:ring-offset-background relative h-5 w-9 transition-colors motion-reduce:transition-none focus-visible:peer-focus:ring-2 focus-visible:peer-focus:ring-offset-2",
          shapeRadiusClass,
        )}
        // i18n-exempt -- DS-1234 [ttl=2025-11-30] — design token attribute, not user copy
        data-token="--color-primary"
      >
        <span
          // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
          className={cn(
            "bg-input absolute top-0.5 ms-0.5 h-4 w-4 shadow transition-transform motion-reduce:transition-none peer-checked:translate-x-4",
            shapeRadiusClass,
          )}
          // i18n-exempt -- DS-1234 [ttl=2025-11-30] — design token attribute, not user copy
          data-token="--surface-input"
        />
      </span>
    </label>
  );
};
