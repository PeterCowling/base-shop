"use client";

import { Switch } from "@acme/design-system/atoms";
import { FormFieldMolecule as FormField } from "@acme/design-system/molecules";

import { ErrorChips } from "./ErrorChips";

interface ServiceToggleFieldProps {
  id: string;
  name: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  errors?: string[];
  disabled?: boolean;
}

export function ServiceToggleField({
  id,
  name,
  label,
  description,
  checked,
  onChange,
  errors,
  disabled,
}: ServiceToggleFieldProps) {
  return (
    <FormField
      label={label}
      htmlFor={id}
      error={<ErrorChips errors={errors} />}
      className="gap-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border-3 bg-surface-3 px-4 py-3">
        <div className="min-w-0 flex-1 text-sm text-muted-foreground">
          {description ? (
            <p id={`${id}-description`} className="leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
        <Switch
          id={id}
          name={name}
          checked={checked}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.checked)}
          aria-describedby={description ? `${id}-description` : undefined}
          disabled={disabled}
          className="shrink-0"
        />
      </div>
    </FormField>
  );
}

export default ServiceToggleField;
