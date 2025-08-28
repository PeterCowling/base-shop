import { useTranslations } from "@i18n/useTranslations.server";

export default async function DesignSystemImportPage() {
  const t = await useTranslations("en");
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">
        {t("cms.theme.importDesignSystem")}
      </h2>
      <p className="text-sm">
        {t("cms.theme.importDesignSystem.help")}
      </p>
    </div>
  );
}
