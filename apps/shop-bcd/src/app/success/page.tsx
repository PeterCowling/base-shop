import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";

export default async function Success() {
  const t = await getTranslations("en");
  return (
    <div className="container mx-auto py-20 text-center">
      <h1 className="mb-4 text-3xl font-semibold">{t("success.thanks")}</h1>
      <p>{t("success.paymentReceived")}</p>
    </div>
  );
}
