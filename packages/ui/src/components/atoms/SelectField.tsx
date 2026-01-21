import * as React from "react";

import { cn } from "../../utils/style";

import { FormField } from "./FormField";
import {
  Select,
  SelectContent,
  SelectItem,
  type SelectProps,
  SelectTrigger,
  type SelectTriggerProps,
  SelectValue,
} from "./primitives/select";

export interface SelectFieldOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectFieldProps extends SelectProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  placeholder?: string;
  triggerProps?: SelectTriggerProps;
  className?: string;
  options?: SelectFieldOption[];
  /**
   * Optional custom content for the menu (e.g., groups). Falls back to options list if provided.
   */
  content?: React.ReactNode;
}

/**
 * Convenience wrapper that wires Select to FormField with label/description/error.
 */
export function SelectField({
  label,
  description,
  error,
  required,
  placeholder,
  triggerProps,
  className,
  options,
  content,
  children,
  ...rootProps
}: SelectFieldProps) {
  const fieldClassName = className;
  const isRequired = required;
  return (
    <FormField
      label={label}
      description={description}
      error={error}
      {...(isRequired !== undefined ? { required: isRequired } : {})}
      {...(fieldClassName !== undefined ? { className: fieldClassName } : {})}
      // eslint-disable-next-line react/no-unstable-nested-components -- UI-2610: inline render prop keeps Select wired to FormField ids for accessibility
      input={({ id, describedBy, ariaInvalid }) => (
        <Select {...rootProps}>
          <SelectTrigger
            id={id}
            aria-describedby={describedBy}
            aria-invalid={ariaInvalid}
            {...triggerProps}
            className={cn(triggerProps?.className)}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {content ??
              options?.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  {...(option.disabled !== undefined
                    ? { disabled: option.disabled }
                    : {})}
                >
                  {option.label}
                </SelectItem>
              )) ??
              children}
          </SelectContent>
        </Select>
      )}
    />
  );
}

export default SelectField;
