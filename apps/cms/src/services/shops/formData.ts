export function parseFilterMappings(formData: FormData): string {
  const keys = formData.getAll("filterMappingsKey").map(String);
  const values = formData.getAll("filterMappingsValue").map(String);
  return JSON.stringify(
    Object.fromEntries(
      keys
        .map((k, i) => [k.trim(), values[i]?.trim() ?? ""])
        .filter(([k, v]) => k && v),
    ),
  );
}

export function parsePriceOverrides(formData: FormData): string {
  const keys = formData.getAll("priceOverridesKey").map(String);
  const values = formData
    .getAll("priceOverridesValue")
    .map((v) => Number(v));
  return JSON.stringify(
    Object.fromEntries(
      keys
        .map((k, i) => [k.trim(), values[i]])
        .filter(([k, v]) => k && !Number.isNaN(v)),
    ),
  );
}

export function parseLocaleOverrides(formData: FormData): string {
  const keys = formData.getAll("localeOverridesKey").map(String);
  const values = formData.getAll("localeOverridesValue").map(String);
  return JSON.stringify(
    Object.fromEntries(
      keys
        .map((k, i) => [k.trim(), values[i]?.trim() ?? ""])
        .filter(([k, v]) => k && v),
    ),
  );
}
