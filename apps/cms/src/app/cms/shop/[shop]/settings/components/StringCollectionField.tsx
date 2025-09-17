"use client";

import { Button, Input } from "@/components/atoms/shadcn";
import { FormField } from "@ui/components/molecules";

import { ErrorChips } from "./ErrorChips";

interface StringCollectionFieldProps {
  idPrefix: string;
  name: string;
  label: string;
  values: string[];
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  placeholder?: string;
  addLabel?: string;
  description?: string;
  errors?: string[];
  emptyState?: string;
}

export function StringCollectionField({
  idPrefix,
  name,
  label,
  values,
  onChange,
  onAdd,
  onRemove,
  placeholder,
  addLabel,
  description,
  errors,
  emptyState,
}: StringCollectionFieldProps) {
  const hasValues = values.length > 0;

  return (
    <FormField
      label={label}
      htmlFor={`${idPrefix}-0`}
      error={<ErrorChips errors={errors} />}
      className="gap-3"
    >
      <div className="space-y-3">
        {hasValues ? (
          values.map((value, index) => (
            <div key={`${idPrefix}-${index}`} className="flex items-center gap-2">
              <Input
                id={`${idPrefix}-${index}`}
                name={name}
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(index, event.target.value)}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="ghost"
                className="h-10 px-3 text-sm font-medium"
                onClick={() => onRemove(index)}
              >
                Remove
              </Button>
            </div>
          ))
        ) : (
          <p className="rounded-md border border-dashed border-border/60 bg-muted/10 px-3 py-2 text-sm text-muted-foreground">
            {emptyState ?? "No entries yet."}
          </p>
        )}
        <div>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 text-sm font-semibold"
            onClick={onAdd}
          >
            {addLabel ?? "Add item"}
          </Button>
        </div>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </FormField>
  );
}

export default StringCollectionField;
