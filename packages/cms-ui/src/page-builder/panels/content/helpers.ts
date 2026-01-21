// packages/ui/src/components/cms/page-builder/panels/content/helpers.ts
export { isOverridden } from "../layout/helpers";

export const nonNegative = (v?: number) =>
  v !== undefined && v < 0 ? "Must be ≥ 0" : undefined;

