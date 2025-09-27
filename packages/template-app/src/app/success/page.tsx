import { useTranslations as getServerTranslations } from "@i18n/useTranslations.server";
import type { Locale } from "@i18n/locales";

export default async function Success() {
  const t = await getServerTranslations("en" as Locale);
  return (
    <div className="mx-auto py-20 text-center">
      <h1 className="mb-4 text-3xl font-semibold">{t("success.thanks")}</h1>
      <p>{t("success.paymentReceived")}</p>
    </div>
  );
}
