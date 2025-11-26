import type { ProductsTranslator } from "./types";

export const translateList = (translator: ProductsTranslator, key: string) =>
  translator(key)
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
