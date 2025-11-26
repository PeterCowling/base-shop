import type { Locale } from "@/lib/locales";

export type Translator = (key: string) => string;

export type TypoSectionProps = {
  lang: Locale;
  translator: Translator;
};
