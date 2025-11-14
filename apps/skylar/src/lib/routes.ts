import { type Locale } from "./locales";

export type Section = "home" | "products" | "realEstate" | "people";

export const SECTION_PATHS: Record<Section, string> = {
  home: "",
  products: "products",
  realEstate: "real-estate",
  people: "people",
};

export function localizedPath(locale: Locale, section: Section) {
  const prefix = locale === "en" ? "" : `/${locale}`;
  const segment = SECTION_PATHS[section];
  if (!segment) {
    return prefix || "/";
  }
  return `${prefix}/${segment}`;
}
