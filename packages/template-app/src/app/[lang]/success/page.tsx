// packages/template-app/src/app/[lang]/success/page.tsx
import type { Locale } from "@acme/i18n/locales";
import { resolveLocale } from "@acme/i18n/locales";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";

import SuccessFinalization from "../../success/SuccessFinalization.client";

export default async function Success({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = resolveLocale(lang);
  const t = await getServerTranslations(locale);
  return (
    <div className="mx-auto py-20 text-center">
      <SuccessFinalization
        processingLabel={t("checkout.processing")}
        thanksLabel={t("success.thanks")}
        paymentReceivedLabel={t("success.paymentReceived")}
      />
    </div>
  );
}
