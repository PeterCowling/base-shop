import * as React from "react";
import type { CheckboxProps as BaseCheckboxProps } from "../ui/checkbox";
import { Checkbox as BaseCheckbox } from "../ui/checkbox";

export type CheckboxProps = BaseCheckboxProps;

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  (props, ref) => <BaseCheckbox ref={ref} {...props} />
);
Checkbox.displayName = "Checkbox";
