"use client";

import type { MappingRowsController } from "../useShopEditorSubmit";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/atoms";
import { FormField } from "@ui/components/molecules";

import type {
  MappingFieldName,
  MappingListFieldFieldConfig,
  MappingListFieldRowErrors,
} from "./MappingListField";
import {
  composeDescribedBy,
  getRowClassName,
  hasErrors,
  isSelectField,
  renderError,
} from "./mappingListField.utils";

type MappingListRowData = MappingRowsController["rows"][number];

interface MappingListRowProps {
  readonly controller: MappingRowsController;
  readonly errors?: MappingListFieldRowErrors;
  readonly idPrefix: string;
  readonly index: number;
  readonly keyField: MappingListFieldFieldConfig<"key">;
  readonly removeButtonLabel: string;
  readonly row: MappingListRowData;
  readonly rowClassName?: string;
  readonly valueField: MappingListFieldFieldConfig<"value">;
}

function renderFieldControl<Field extends MappingFieldName>(
  field: MappingListFieldFieldConfig<Field>,
  {
    describedBy,
    id,
    onChange,
    value,
  }: {
    describedBy?: string;
    id: string;
    onChange: (value: string) => void;
    value: string;
  },
) {
  if (isSelectField(field)) {
    return (
      <Select
        name={field.name}
        value={value === "" ? undefined : value}
        onValueChange={onChange}
      >
        <SelectTrigger id={id} aria-describedby={describedBy}>
          <SelectValue placeholder={field.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      id={id}
      name={field.name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.placeholder}
      aria-describedby={describedBy}
      type={field.type}
      inputMode={field.inputMode}
      autoComplete={field.autoComplete}
    />
  );
}

export default function MappingListRow({
  controller,
  errors,
  idPrefix,
  index,
  keyField,
  removeButtonLabel,
  row,
  rowClassName,
  valueField,
}: MappingListRowProps) {
  const keyId = `${idPrefix}-${keyField.field}-${index}`;
  const valueId = `${idPrefix}-${valueField.field}-${index}`;

  const keyMessages = errors?.key;
  const valueMessages = errors?.value;
  const generalMessages = errors?.general;

  const keyErrorId = hasErrors(keyMessages)
    ? `${idPrefix}-${index}-${keyField.field}-errors`
    : undefined;
  const valueErrorId = hasErrors(valueMessages)
    ? `${idPrefix}-${index}-${valueField.field}-errors`
    : undefined;
  const rowErrorId = hasErrors(generalMessages)
    ? `${idPrefix}-${index}-row-errors`
    : undefined;

  const keyDescribedBy = composeDescribedBy(keyErrorId, rowErrorId);
  const valueDescribedBy = composeDescribedBy(valueErrorId, rowErrorId);
  const generalError = renderError(generalMessages, rowErrorId);

  return (
    <div className={getRowClassName(rowClassName)}>
      <FormField
        label={keyField.label}
        htmlFor={keyId}
        required={keyField.required}
        error={renderError(keyMessages, keyErrorId)}
      >
        {renderFieldControl(keyField, {
          describedBy: keyDescribedBy,
          id: keyId,
          onChange: (value) => controller.update(index, keyField.field, value),
          value: row[keyField.field],
        })}
      </FormField>

      <FormField
        label={valueField.label}
        htmlFor={valueId}
        required={valueField.required}
        error={renderError(valueMessages, valueErrorId)}
      >
        {renderFieldControl(valueField, {
          describedBy: valueDescribedBy,
          id: valueId,
          onChange: (value) => controller.update(index, valueField.field, value),
          value: row[valueField.field],
        })}
      </FormField>

      <Button
        type="button"
        variant="ghost"
        onClick={() => controller.remove(index)}
        className="self-start sm:self-auto"
      >
        {removeButtonLabel}
      </Button>

      {generalError ? <div className="sm:col-span-3">{generalError}</div> : null}
    </div>
  );
}
