import NotFoundContent from "@/components/NotFoundContent";
import { DEFAULT_LOCALE } from "@/lib/locales";
import { createTranslator, loadMessages } from "@/lib/messages";
import { withLocale } from "@/lib/routes";

export default async function RootNotFound() {
  const messages = await loadMessages(DEFAULT_LOCALE);
  const t = createTranslator(messages);

  return (
    <NotFoundContent
      title={t("notFound.title")}
      body={t("notFound.body")}
      primaryCta={t("notFound.primary")}
      primaryHref={withLocale("/", DEFAULT_LOCALE)}
      secondaryCta={t("notFound.secondary")}
      secondaryHref={withLocale("/shop", DEFAULT_LOCALE)}
    />
  );
}
