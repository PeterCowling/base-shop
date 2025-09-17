"use client";

import type { InputHTMLAttributes, HTMLInputTypeAttribute } from "react";

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components";
import { FormField } from "@ui/components/molecules";

import type {
  MappingRowsController,
  SelectOption,
} from "../useShopEditorSubmit";
import { ErrorChips } from "./ErrorChips";

interface MappingInputFieldConfig {
  readonly label: string;
  readonly name: string;
  readonly placeholder?: string;
  readonly type?: HTMLInputTypeAttribute;
  readonly inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  readonly autoComplete?: InputHTMLAttributes<HTMLInputElement>["autoComplete"];
}

interface MappingSelectFieldConfig {
  readonly type: "select";
  readonly label: string;
  readonly name: string;
  readonly placeholder?: string;
  readonly options: readonly SelectOption[];
}

type MappingValueFieldConfig = MappingInputFieldConfig | MappingSelectFieldConfig;

export interface MappingListFieldProps {
  readonly controller: MappingRowsController;
  readonly keyField: MappingInputFieldConfig;
  readonly valueField: MappingValueFieldConfig;
  readonly addLabel: string;
  readonly removeLabel?: string;
  readonly emptyState?: string;
  readonly description?: string;
  readonly errors?: string[];
  readonly errorId?: string;
  readonly rowLayout?: string;
}

export function MappingListField({
  controller,
  keyField,
  valueField,
  addLabel,
  removeLabel = "Remove",
  emptyState = "No entries configured.",
  description,
  errors,
  errorId,
  rowLayout,
}: MappingListFieldProps) {
  const { rows, add, update, remove } = controller;
  const describedBy = errors && errors.length > 0 && errorId ? errorId : undefined;
  const rowClassName = rowLayout
    ? `grid gap-4 sm:items-end ${rowLayout}`
    : "grid gap-4 sm:grid-cols-[2fr,1fr,auto] sm:items-end";

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyState}</p>
      ) : (
        rows.map((row, index) => {
          const keyId = `${keyField.name}-${index}`;
          const valueId = `${valueField.name}-${index}`;

          return (
            <div key={keyId} className={rowClassName}>
              <FormField label={keyField.label} htmlFor={keyId}>
                <Input
                  id={keyId}
                  name={keyField.name}
                  value={row.key}
                  placeholder={keyField.placeholder}
                  onChange={(event) => update(index, "key", event.target.value)}
                  autoComplete={keyField.autoComplete ?? "off"}
                  inputMode={keyField.inputMode}
                  type={keyField.type ?? "text"}
                  aria-describedby={describedBy}
                />
              </FormField>

              <FormField label={valueField.label} htmlFor={valueId}>
                {"type" in valueField && valueField.type === "select" ? (
                  <Select
                    name={valueField.name}
                    value={row.value === "" ? undefined : row.value}
                    onValueChange={(value) => update(index, "value", value)}
                  >
                    <SelectTrigger id={valueId} aria-describedby={describedBy}>
                      <SelectValue placeholder={valueField.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {valueField.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={valueId}
                    name={valueField.name}
                    value={row.value}
                    placeholder={valueField.placeholder}
                    onChange={(event) => update(index, "value", event.target.value)}
                    autoComplete={(valueField as MappingInputFieldConfig).autoComplete ?? "off"}
                    inputMode={(valueField as MappingInputFieldConfig).inputMode}
                    type={(valueField as MappingInputFieldConfig).type ?? "text"}
                    aria-describedby={describedBy}
                  />
                )}
              </FormField>

              <Button type="button" variant="ghost" onClick={() => remove(index)}>
                {removeLabel}
              </Button>
            </div>
          );
        })
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" onClick={add} className="w-full sm:w-auto">
          {addLabel}
        </Button>
        {errors && errors.length > 0 ? (
          <span id={errorId} className="inline-flex">
            <ErrorChips errors={errors} />
          </span>
        ) : null}
      </div>

      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export default MappingListField;
