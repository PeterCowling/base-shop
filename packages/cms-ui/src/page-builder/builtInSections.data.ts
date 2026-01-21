// Page Builder: build translated lists of built-in section variants.
// Consumers must pass the current translator `t` to localize labels/descriptions.

import { getFooterVariants } from "./built-in-sections/footer";
import { getHeaderVariants } from "./built-in-sections/header";
import { getOtherSections } from "./built-in-sections/other";
import type { BuiltInSection } from "./built-in-sections/types";

function resolveLabels(items: BuiltInSection[], t: (key: string) => string): BuiltInSection[] {
  return items.map((p) => ({
    ...p,
    label: p.labelKey ? t(p.labelKey) : p.label,
    description: p.descriptionKey ? t(p.descriptionKey) : p.description,
  }));
}

export function getBuiltInSections(t: (key: string) => string): BuiltInSection[] {
  return [
    ...resolveLabels(getHeaderVariants(t), t),
    ...resolveLabels(getFooterVariants(t), t),
    ...getOtherSections(t),
  ];
}

export type { BuiltInSection };
