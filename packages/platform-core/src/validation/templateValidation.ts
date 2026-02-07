import type { PageComponent } from "@acme/types";

import { validateComponentRules } from "./componentRules";
import { type ParentKind,validatePlacement } from "./placement";

export type ValidationIssue = { path: Array<string | number>; message: string };
export type ValidationResult = { ok: true } | { ok: false; errors: string[]; issues?: ValidationIssue[] };

export function validateTemplateCreation(
  components: PageComponent[],
  options: { parent: ParentKind; sectionsOnly?: boolean },
): ValidationResult {
  const comp = validateComponentRules(components);
  if (comp.ok === false) return comp;
  const place = validatePlacement(components, options);
  if (place.ok === false) return place;
  return { ok: true };
}

