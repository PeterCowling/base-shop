"use client";

import type { ComponentProps, ReactNode } from "react";

import {
  Button,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components";

import type { MappingRowsController } from "../useShopEditorSubmit";

import ErrorChips from "./ErrorChips";

type MappingFieldName = "key" | "value";

export interface MappingListFieldRowErrors {
  readonly key?: string[];
  readonly value?: string[];
  readonly general?: string[];
}

export interface MappingListFieldErrors {
  readonly general?: string[];
  readonly rows?: readonly MappingListFieldRowErrors[];
}

interface BaseFieldConfig<Field extends MappingFieldName> {
  readonly field: Field;
  readonly label: string;
  readonly name: string;
  readonly placeholder?: string;
  readonly required?: boolean;
}

export interface MappingListFieldInputConfig<
  Field extends MappingFieldName,
> extends BaseFieldConfig<Field> {
  readonly kind?: "input";
  readonly type?: ComponentProps<typeof Input>["type"];
  readonly inputMode?: ComponentProps<typeof Input>["inputMode"];
  readonly autoComplete?: string;
}

export interface MappingListFieldSelectOption {
  readonly label: string;
  readonly value: string;
}

export interface MappingListFieldSelectConfig<
  Field extends MappingFieldName,
> extends BaseFieldConfig<Field> {
  readonly kind: "select";
  readonly options: readonly MappingListFieldSelectOption[];
}

export type MappingListFieldFieldConfig<Field extends MappingFieldName> =
  | MappingListFieldInputConfig<Field>
  | MappingListFieldSelectConfig<Field>;

export interface MappingListFieldProps {
  readonly controller: MappingRowsController;
  readonly idPrefix: string;
  readonly keyField: MappingListFieldFieldConfig<"key">;
  readonly valueField: MappingListFieldFieldConfig<"value">;
  readonly emptyMessage?: ReactNode;
  readonly addButtonLabel: string;
  readonly removeButtonLabel?: string;
  readonly errors?: MappingListFieldErrors;
  readonly rowClassName?: string;
  readonly className?: string;
}

const DEFAULT_REMOVE_LABEL = "Remove";
const BASE_ROW_CLASSNAME = "grid gap-4 sm:items-end";
const DEFAULT_ROW_TEMPLATE = "sm:grid-cols-[2fr,1fr,auto]";
const BASE_CONTAINER_CLASSNAME = "space-y-4";

function hasErrors(messages?: readonly string[]) {
  return Array.isArray(messages) && messages.length > 0;
}

function isSelectField<Field extends MappingFieldName>(
  field: MappingListFieldFieldConfig<Field>,
): field is MappingListFieldSelectConfig<Field> {
  return field.kind === "select";
}

function joinClassNames(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function composeDescribedBy(...ids: Array<string | undefined>) {
  const filtered = ids.filter(Boolean);
  return filtered.length > 0 ? filtered.join(" ") : undefined;
}

function renderError(errors?: string[], id?: string) {
  if (!hasErrors(errors)) {
    return undefined;
  }

  return (
    <span id={id}>
      <ErrorChips errors={errors} />
    </span>
  );
}

function getRowClassName(rowClassName?: string) {
  return joinClassNames(BASE_ROW_CLASSNAME, rowClassName ?? DEFAULT_ROW_TEMPLATE);
}

export default function MappingListField({
  controller,
  idPrefix,
  keyField,
  valueField,
  emptyMessage,
  addButtonLabel,
  removeButtonLabel = DEFAULT_REMOVE_LABEL,
  errors,
  rowClassName,
  className,
}: MappingListFieldProps) {
  const rows = controller.rows;
  const rowErrors = errors?.rows ?? [];
  const containerClassName = joinClassNames(BASE_CONTAINER_CLASSNAME, className);

  return (
    <div className={containerClassName}>
      {rows.length === 0 ? (
        emptyMessage ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : null
      ) : (
        rows.map((row, index) => {
          const keyId = `${idPrefix}-${keyField.field}-${index}`;
          const valueId = `${idPrefix}-${valueField.field}-${index}`;
          const currentRowErrors = rowErrors[index];
          const keyMessages = currentRowErrors?.key;
          const valueMessages = currentRowErrors?.value;
          const generalMessages = currentRowErrors?.general;
          const keyErrorId = hasErrors(keyMessages)
            ? `${idPrefix}-${index}-${keyField.field}-errors`
            : undefined;
          const valueErrorId = hasErrors(valueMessages)
            ? `${idPrefix}-${index}-${valueField.field}-errors`
            : undefined;
          const rowErrorId = hasErrors(generalMessages)
            ? `${idPrefix}-${index}-row-errors`
            : undefined;

          const keyFieldNode = (
            <FormField
              label={keyField.label}
              htmlFor={keyId}
              required={keyField.required}
              error={renderError(keyMessages, keyErrorId)}
            >
              {isSelectField(keyField) ? (
                <Select
                  name={keyField.name}
                  value={row[keyField.field] === "" ? undefined : row[keyField.field]}
                  onValueChange={(value) =>
                    controller.update(index, keyField.field, value)
                  }
                >
                  <SelectTrigger
                    id={keyId}
                    aria-describedby={composeDescribedBy(
                      keyErrorId,
                      rowErrorId,
                    )}
                  >
                    <SelectValue placeholder={keyField.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {keyField.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={keyId}
                  name={keyField.name}
                  value={row[keyField.field]}
                  onChange={(event) =>
                    controller.update(index, keyField.field, event.target.value)
                  }
                  placeholder={keyField.placeholder}
                  aria-describedby={composeDescribedBy(keyErrorId, rowErrorId)}
                  type={keyField.type}
                  inputMode={keyField.inputMode}
                  autoComplete={keyField.autoComplete}
                />
              )}
            </FormField>
          );

          const valueFieldNode = (
            <FormField
              label={valueField.label}
              htmlFor={valueId}
              required={valueField.required}
              error={renderError(valueMessages, valueErrorId)}
            >
              {isSelectField(valueField) ? (
                <Select
                  name={valueField.name}
                  value={
                    row[valueField.field] === ""
                      ? undefined
                      : row[valueField.field]
                  }
                  onValueChange={(value) =>
                    controller.update(index, valueField.field, value)
                  }
                >
                  <SelectTrigger
                    id={valueId}
                    aria-describedby={composeDescribedBy(
                      valueErrorId,
                      rowErrorId,
                    )}
                  >
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
                  value={row[valueField.field]}
                  onChange={(event) =>
                    controller.update(
                      index,
                      valueField.field,
                      event.target.value,
                    )
                  }
                  placeholder={valueField.placeholder}
                  aria-describedby={composeDescribedBy(valueErrorId, rowErrorId)}
                  type={valueField.type}
                  inputMode={valueField.inputMode}
                  autoComplete={valueField.autoComplete}
                />
              )}
            </FormField>
          );

          return (
            <div key={`${idPrefix}-row-${index}`} className={getRowClassName(rowClassName)}>
              {keyFieldNode}
              {valueFieldNode}
              <Button
                type="button"
                variant="ghost"
                onClick={() => controller.remove(index)}
                className="self-start sm:self-auto"
              >
                {removeButtonLabel}
              </Button>
              {hasErrors(generalMessages) ? (
                <div className="sm:col-span-3">
                  <span id={rowErrorId}>
                    <ErrorChips errors={generalMessages} />
                  </span>
                </div>
              ) : null}
            </div>
          );
        })
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          onClick={controller.add}
          className="w-full sm:w-auto"
        >
          {addButtonLabel}
        </Button>
        {hasErrors(errors?.general) ? (
          <ErrorChips errors={errors?.general} />
        ) : null}
      </div>
    </div>
  );
}
