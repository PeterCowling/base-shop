import type { createTranslator } from "@/lib/messages";
import type { Locale } from "@/lib/locales";

export type ProductsTranslator = ReturnType<typeof createTranslator>;

export interface ProductsPageComponentProps {
  lang: Locale;
  translator: ProductsTranslator;
}

