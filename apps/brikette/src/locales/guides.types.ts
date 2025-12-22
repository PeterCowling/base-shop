// file path: src/locales/guides.types.ts
// -----------------------------------------------------------------------------
// Types for the `guides` i18n namespace and loader plumbing.
// -----------------------------------------------------------------------------

export type GuidesNamespace = {
  content: Record<string, unknown>;
  [key: string]: unknown;
};

export type JsonModule<T = unknown> = { default?: T } | T;

export type PartialGuidesNamespace = {
  content: Record<string, unknown>;
  [key: string]: unknown;
};

export type ModuleRecord<T = unknown> = Record<string, JsonModule<T>>;

export type ModuleOverrides = {
  legacy?: ModuleRecord<GuidesNamespace>;
  splitGlobal?: ModuleRecord;
  splitContent?: ModuleRecord;
};

export type GuidesState = {
  guidesBundles: Map<string, GuidesNamespace>;
  splitLocales: Set<string>;
};

export type GlobalGuidesState = {
  guidesBundles: Map<string, GuidesNamespace>;
  splitLocales: Set<string>;
};

