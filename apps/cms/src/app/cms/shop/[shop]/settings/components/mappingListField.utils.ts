import { createElement } from "react";
import type {
  MappingFieldName,
  MappingListFieldFieldConfig,
  MappingListFieldSelectConfig,
} from "./MappingListField";

import ErrorChips from "./ErrorChips";

const BASE_ROW_CLASSNAME = "grid gap-4 sm:items-end";
const DEFAULT_ROW_TEMPLATE = "sm:grid-cols-[2fr,1fr,auto]";

export function hasErrors(messages?: readonly string[]) {
  return Array.isArray(messages) && messages.length > 0;
}

export function isSelectField<Field extends MappingFieldName>(
  field: MappingListFieldFieldConfig<Field>,
): field is MappingListFieldSelectConfig<Field> {
  return field.kind === "select";
}

export function joinClassNames(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function composeDescribedBy(...ids: Array<string | undefined>) {
  const filtered = ids.filter(Boolean);
  return filtered.length > 0 ? filtered.join(" ") : undefined;
}

export function renderError(errors?: string[], id?: string) {
  if (!hasErrors(errors)) {
    return undefined;
  }

  return createElement(
    "span",
    { id },
    createElement(ErrorChips, { errors }),
  );
}

export function getRowClassName(rowClassName?: string) {
  return joinClassNames(BASE_ROW_CLASSNAME, rowClassName ?? DEFAULT_ROW_TEMPLATE);
}
