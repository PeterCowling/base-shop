import type { Locale } from "@acme/i18n";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";

import SuccessAnalytics from "./SuccessAnalytics.client";

export default async function Success({ params }: { params: { lang: Locale } }) {
  const t = await getTranslations(params.lang);
  return (
    <div className="mx-auto py-20 text-center">
      <SuccessAnalytics locale={params.lang} />
      <h1 className="mb-4 text-3xl font-semibold">{t("success.thanks")}</h1>
      <p>{t("success.paymentReceived")}</p>
    </div>
  );
}
