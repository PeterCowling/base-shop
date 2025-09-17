"use client";

import { Switch } from "@/components/atoms";
import { FormField } from "@ui/components/molecules";

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
      <div className="flex items-center justify-between gap-4 rounded-md border border-border/60 bg-muted/10 px-4 py-3">
        <div className="flex-1 text-sm text-muted-foreground">
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
          onChange={(event) => onChange(event.target.checked)}
          aria-describedby={description ? `${id}-description` : undefined}
          disabled={disabled}
        />
      </div>
    </FormField>
  );
}

export default ServiceToggleField;
