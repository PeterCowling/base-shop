import * as React from "react";
import type { InputProps as BaseInputProps } from "../ui/input";
import { Input as BaseInput } from "../ui/input";

export type InputProps = BaseInputProps;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, wrapperClassName, ...props }, ref) => (
    <BaseInput
      ref={ref}
      className={className}
      wrapperClassName={wrapperClassName}
      {...props}
    />
  )
);
Input.displayName = "Input";
