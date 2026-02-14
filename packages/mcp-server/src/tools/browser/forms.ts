import type { BicAffordance, BicForm, BicFormFieldRef } from "./bic.js";

const FORM_ROLES = new Set([
  "textbox",
  "searchbox",
  "combobox",
  "listbox",
  "option",
  "checkbox",
  "radio",
  "switch",
  "slider",
  "spinbutton",
]);

export function deriveFormsFromAffordances(input: {
  affordances: ReadonlyArray<BicAffordance>;
}): ReadonlyArray<BicForm> {
  const fields: BicFormFieldRef[] = [];

  for (const affordance of input.affordances) {
    if (!FORM_ROLES.has(affordance.role)) {
      continue;
    }

    fields.push({ actionId: affordance.actionId });
  }

  if (fields.length === 0) {
    return [];
  }

  // v0.1: a single coarse form section. Later we can split by landmark/fieldset heuristics.
  return [{ section: "Main", fields }];
}

