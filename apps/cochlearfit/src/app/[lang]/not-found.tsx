import NotFoundContent from "@/components/NotFoundContent";
import { resolveLocale } from "@/lib/locales";
import { createTranslator, loadMessages } from "@/lib/messages";
import { withLocale } from "@/lib/routes";

export default async function NotFoundPage({
  params,
}: {
  params: Promise<{ lang?: string | string[] }>;
}) {
  const resolved = await params;
  const locale = resolveLocale(resolved?.lang);
  const messages = await loadMessages(locale);
  const t = createTranslator(messages);

  return (
    <NotFoundContent
      title={t("notFound.title")}
      body={t("notFound.body")}
      primaryCta={t("notFound.primary")}
      primaryHref={withLocale("/", locale)}
      secondaryCta={t("notFound.secondary")}
      secondaryHref={withLocale("/shop", locale)}
    />
  );
}
