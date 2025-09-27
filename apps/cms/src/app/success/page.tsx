// apps/cms/src/app/success/page.tsx
import { useTranslations } from "@i18n/Translations";

export default function Success() {
  const t = useTranslations();
  return (
    <div className="mx-auto py-20 text-center">
      <h1 className="mb-4 text-3xl font-semibold">{t("success.thanks")}</h1>
      <p>{t("success.paymentReceived")}</p>
    </div>
  );
}
