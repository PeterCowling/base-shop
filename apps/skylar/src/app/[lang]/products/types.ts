import type { Locale } from "@/lib/locales";
import type { createTranslator } from "@/lib/messages";

export type ProductsTranslator = ReturnType<typeof createTranslator>;

export interface ProductsPageComponentProps {
  lang: Locale;
  translator: ProductsTranslator;
}

