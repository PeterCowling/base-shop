import { type ShopForm,shopSchema } from "../../../actions/schemas";
import { formDataEntries } from "../../../utils/formData";
import {
  parseFilterMappings,
  parseLocaleOverrides,
  parsePriceOverrides,
} from "../formData";

export type { ShopForm };

export function parseShopForm(formData: FormData): {
  data?: ShopForm;
  errors?: Record<string, string[]>;
} {
  const themeDefaultsRaw = formData.get("themeDefaults") as string | null;
  const themeOverridesRaw = formData.get("themeOverrides") as string | null;

  const entries = Array.from(formDataEntries(formData)).filter(
    ([k]) =>
      ![
        "filterMappingsKey",
        "filterMappingsValue",
        "priceOverridesKey",
        "priceOverridesValue",
        "localeOverridesKey",
        "localeOverridesValue",
      ].includes(k)
  ) as [string, FormDataEntryValue][];

  const parsed = shopSchema.safeParse({
    ...Object.fromEntries(entries),
    themeDefaults: themeDefaultsRaw ?? "{}",
    themeOverrides: themeOverridesRaw ?? "{}",
    trackingProviders: formData.getAll("trackingProviders"),
    filterMappings: parseFilterMappings(formData),
    priceOverrides: parsePriceOverrides(formData),
    localeOverrides: parseLocaleOverrides(formData),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  return { data: parsed.data };
}
