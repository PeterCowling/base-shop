import { TranslationsProvider } from "@acme/i18n";
import { LOCALES, resolveLocale } from "@/lib/locales";
import { loadMessages } from "@/lib/messages";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { CartProvider } from "@/contexts/cart/CartContext";
import Shell from "@/components/layout/Shell";
import LocalePreferenceSync from "@/components/LocalePreferenceSync";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang?: string | string[] }>;
}) {
  const resolved = await params;
  const locale = resolveLocale(resolved?.lang);
  const messages = await loadMessages(locale);

  return (
    <LocaleProvider locale={locale}>
      <TranslationsProvider messages={messages}>
        <CartProvider>
          <LocalePreferenceSync />
          <Shell>{children}</Shell>
        </CartProvider>
      </TranslationsProvider>
    </LocaleProvider>
  );
}
