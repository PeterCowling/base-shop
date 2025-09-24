// packages/ui/src/components/cms/page-builder/panels/layout/helpers.ts
export const isOverridden = (base: unknown, val: unknown) => {
  if (val === undefined || val === "") return false;
  if (base === undefined || base === "") return true;
  const a = String(base).trim();
  const b = String(val).trim();
  return a !== b;
};

export const cssError = (prop: string, value?: string) => {
  if (!value) return undefined;
  const supports = globalThis.CSS?.supports;
  if (typeof supports !== "function") return undefined;
  return supports.call(globalThis.CSS, prop, value) ? undefined : `Invalid ${prop} value`;
};

