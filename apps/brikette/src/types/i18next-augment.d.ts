// src/types/i18next-augment.d.ts
//
// Augment i18next’s global module so TypeScript *knows* that `t()`
// can only yield a string and that selector helpers exist for react-i18next.
import "i18next";

declare module "i18next" {
  export type ApplyTarget<Target = unknown, TOptions = unknown> = Target;
  export type ConstrainTarget<TOptions = unknown> = unknown;
  export type GetSource<TNamespace = unknown, TKeyPrefix = unknown> = unknown;
  export type SelectorFn<TSource = unknown, TTarget = unknown, TOptions = unknown> = (
    ...args: unknown[]
  ) => unknown;

  interface CustomTypeOptions {
    /** keep namespace typing flexible across route-level translators */
    defaultNS: string;
    /** relaxed resources typing – individual ns files provide key safety */
    resources: Record<string, Record<string, string>>;
    /** align the types with the runtime flags in i18n.ts */
    returnNull: false;
    returnObjects: true;
    enableSelector?: boolean;
  }

  interface TFunction<
    Ns extends import("i18next").Namespace = import("i18next").DefaultNamespace,
    KPrefix = undefined
  > {
    (key: string | string[], options?: Record<string, unknown>): any;
    (key: string | string[], defaultValue: string, options?: Record<string, unknown>): any;
  }
}
