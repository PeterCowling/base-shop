"use client";

import { Fragment } from "react";
import { Button, Input } from "@/components/atoms/shadcn";
import { FormField } from "@ui/components/molecules";

import { ErrorChip } from "./ErrorChip";

interface CollectionFieldProps {
  label: string;
  name: string;
  values: string[];
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  placeholder?: string;
  description?: string;
  addLabel?: string;
  error?: string | string[];
}

export function CollectionField({
  label,
  name,
  values,
  onChange,
  onAdd,
  onRemove,
  placeholder,
  description,
  addLabel = "Add item",
  error,
}: CollectionFieldProps) {
  const rows = values.length > 0 ? values : [""];

  return (
    <FormField
      label={label}
      htmlFor={`${name}-0`}
      error={<ErrorChip error={error} />}
      className="space-y-2"
    >
      <div className="space-y-2">
        {rows.map((value, index) => (
          <Fragment key={`${name}-${index}`}>
            <div className="flex items-center gap-2">
              <Input
                id={`${name}-${index}`}
                name={name}
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(index, event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                className="h-8 px-3 text-xs"
                onClick={() => onRemove(index)}
              >
                Remove
              </Button>
            </div>
          </Fragment>
        ))}
        <Button
          type="button"
          variant="ghost"
          className="h-8 px-3 text-xs"
          onClick={onAdd}
        >
          {addLabel}
        </Button>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </FormField>
  );
}
