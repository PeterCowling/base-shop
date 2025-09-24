"use client";

import type { ComponentProps, ReactNode } from "react";

import { Button, Input } from "@ui/components/atoms";

import type { MappingRowsController } from "../useShopEditorSubmit";

import ErrorChips from "./ErrorChips";
import MappingListRow from "./MappingListRow";
import { hasErrors, joinClassNames } from "./mappingListField.utils";

export type MappingFieldName = "key" | "value";

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
const BASE_CONTAINER_CLASSNAME = "space-y-4";

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
        rows.map((row, index) => (
          <MappingListRow
            key={`${idPrefix}-row-${index}`}
            controller={controller}
            errors={rowErrors[index]}
            idPrefix={idPrefix}
            index={index}
            keyField={keyField}
            removeButtonLabel={removeButtonLabel}
            row={row}
            rowClassName={rowClassName}
            valueField={valueField}
          />
        ))
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
