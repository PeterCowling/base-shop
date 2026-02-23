import { redirect } from "next/navigation";

import { resolveLocale } from "@acme/i18n/locales";

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang = resolveLocale(rawLang);
  redirect(`/${lang}/shop`);
}
