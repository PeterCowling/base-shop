import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { TranslationsProvider } from "@acme/i18n";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { CartProvider } from "@/contexts/cart/CartContext";
import type { Locale } from "@/types/locale";
import type { Product, ProductColor, ProductVariant } from "@/types/product";
import enMessages from "../i18n/en.json";
import itMessages from "../i18n/it.json";
import esMessages from "../i18n/es.json";
import deMessages from "../i18n/de.json";
import cochlearfitVariants from "../../../data/shops/cochlearfit/variants.json";

const messageByLocale: Record<Locale, Record<string, string>> = {
  en: enMessages as Record<string, string>,
  it: itMessages as Record<string, string>,
  es: esMessages as Record<string, string>,
  de: deMessages as Record<string, string>,
};

type VariantPricingRecord = {
  id: string;
  productSlug: string;
  size: ProductVariant["size"];
  color: ProductVariant["color"];
  price: number;
  currency: ProductVariant["currency"];
  stripePriceId: string;
};

const COLOR_LABEL: Record<ProductColor, string> = {
  sand: "Sand",
  ocean: "Ocean",
  berry: "Berry",
};

const COLOR_HEX: Record<ProductColor, string> = {
  sand: "var(--color-sand)",
  ocean: "var(--color-ocean)",
  berry: "var(--color-berry)",
};

const cartProducts: Product[] = (() => {
  if (!Array.isArray(cochlearfitVariants)) return [];
  const grouped = new Map<string, VariantPricingRecord[]>();
  for (const row of cochlearfitVariants as unknown as VariantPricingRecord[]) {
    if (!row || typeof row !== "object") continue;
    const slug = typeof row.productSlug === "string" ? row.productSlug : "";
    if (!slug) continue;
    const list = grouped.get(slug) ?? [];
    list.push(row);
    grouped.set(slug, list);
  }

  return Array.from(grouped.entries()).map(([slug, variants]) => ({
    id: slug,
    slug,
    name: slug,
    style: slug,
    shortDescription: "",
    longDescription: "",
    featureBullets: [],
    materials: [],
    careInstructions: [],
    compatibilityNotes: [],
    images: [],
    variants: variants
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const color = row.color;
        if (color !== "sand" && color !== "ocean" && color !== "berry") return null;
        const size = row.size;
        if (size !== "kids" && size !== "adult") return null;
        return {
          id: row.id,
          size,
          color,
          colorLabel: COLOR_LABEL[color],
          colorHex: COLOR_HEX[color],
          price: typeof row.price === "number" ? row.price : 0,
          currency: "USD",
          stripePriceId: typeof row.stripePriceId === "string" ? row.stripePriceId : "",
          inStock: true,
        } satisfies ProductVariant;
      })
      .filter((row): row is ProductVariant => Boolean(row)),
  }));
})();

type ProviderOptions = {
  withCart?: boolean;
  locale?: Locale;
};

const buildWrapper = ({ withCart, locale = "en" }: ProviderOptions) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const content = withCart
      ? <CartProvider products={cartProducts}>{children}</CartProvider>
      : children;
    const messages = messageByLocale[locale] ?? messageByLocale.en;
    return (
      <LocaleProvider locale={locale}>
        <TranslationsProvider messages={messages}>{content}</TranslationsProvider>
      </LocaleProvider>
    );
  };

  return Wrapper;
};

export const renderWithProviders = (
  ui: React.ReactElement,
  options: ProviderOptions & RenderOptions = {}
) => {
  const { withCart = false, locale = "en", ...rest } = options;
  return render(ui, { wrapper: buildWrapper({ withCart, locale }), ...rest });
};
