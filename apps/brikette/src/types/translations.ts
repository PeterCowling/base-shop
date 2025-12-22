// src/types/translations.ts
export type FlatTranslation = Record<string, string>;
export type NestedTranslation = string | { [key: string]: NestedTranslation };

export interface TranslationResources {
  greeting: string;
  careerPage: {
    title: string;
    intro: string;
  };
  meta: {
    title: string;
    description: string;
  };

  /** allow extra keys you haven't listed yet */
  [key: string]: unknown;
}
