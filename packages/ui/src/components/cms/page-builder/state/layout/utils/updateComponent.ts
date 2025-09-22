import type { PageComponent } from "@acme/types";

export function updateComponent(
  list: PageComponent[],
  id: string,
  patch: Partial<PageComponent>,
): PageComponent[] {
  const numericFields = [
    "minItems",
    "maxItems",
    "columns",
    "desktopItems",
    "tabletItems",
    "mobileItems",
    "zIndex",
  ] as const;
  type NumericField = (typeof numericFields)[number];
  const normalized: Partial<PageComponent> & Record<NumericField, number | undefined> = {
    ...patch,
  } as Partial<PageComponent> & Record<NumericField, number | undefined>;
  for (const key of numericFields) {
    const val = (patch as Record<NumericField, unknown>)[key];
    if (typeof val === "string") {
      const num = Number(val);
      normalized[key] = Number.isNaN(num) ? undefined : (num as number);
    }
  }
  return list.map((c) => {
    if (c.id === id) return { ...c, ...normalized } as PageComponent;
    if ("children" in c && Array.isArray(c.children)) {
      return { ...c, children: updateComponent(c.children, id, normalized) } as PageComponent;
    }
    return c;
  });
}

