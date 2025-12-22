import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { TranslationsProvider } from "@acme/i18n";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { CartProvider } from "@/contexts/cart/CartContext";
import type { Locale } from "@/types/locale";
import enMessages from "../i18n/en.json";
import itMessages from "../i18n/it.json";

const messageByLocale: Record<Locale, Record<string, string>> = {
  en: enMessages as Record<string, string>,
  it: itMessages as Record<string, string>,
};

type ProviderOptions = {
  withCart?: boolean;
  locale?: Locale;
};

const buildWrapper = ({ withCart, locale = "en" }: ProviderOptions) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const content = withCart ? <CartProvider>{children}</CartProvider> : children;
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
