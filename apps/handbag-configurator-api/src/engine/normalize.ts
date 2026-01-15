import type { ProductConfigSchema, SelectionState } from "@acme/product-configurator";

export function normalizeSelections(
  schema: ProductConfigSchema,
  selections: SelectionState,
) {
  const normalizedSelections: SelectionState = {};
  const invalidKeys: string[] = [];

  for (const property of schema.properties) {
    const allowedValues = new Set(property.values.map((value) => value.value));
    const requested = selections[property.key];

    if (typeof requested === "string" && allowedValues.has(requested)) {
      normalizedSelections[property.key] = requested;
      continue;
    }

    normalizedSelections[property.key] = property.defaultValue;
    if (typeof requested === "string" && requested !== property.defaultValue) {
      invalidKeys.push(property.key);
    }
  }

  return { normalizedSelections, invalidKeys };
}

