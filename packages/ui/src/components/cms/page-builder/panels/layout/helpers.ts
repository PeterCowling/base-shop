// packages/ui/src/components/cms/page-builder/panels/layout/helpers.ts
export const isOverridden = (base: unknown, val: unknown) => {
  if (val === undefined || val === "") return false;
  if (base === undefined || base === "") return true;
  const a = String(base).trim();
  const b = String(val).trim();
  return a !== b;
};

export const cssError = (prop: string, value?: string) =>
  value && !globalThis.CSS?.supports(prop, value)
    ? `Invalid ${prop} value`
    : undefined;

