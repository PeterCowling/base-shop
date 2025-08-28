import { useTranslations as getTranslations } from "@acme/i18n/useTranslations";

export default async function DesignSystemImportPage() {
  const t = await getTranslations("en");
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">{t("cms.theme.importDesignSystem")}</h2>
      <p className="text-sm">
        {t("cms.theme.importDesignSystem.description")}
      </p>
      <p className="mt-2 text-xs">
        <a
          href="/docs/design-system-package-import"
          className="text-blue-600 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("cms.theme.importDesignSystem.packageGuide")}
        </a>{" "}
        {t("common.and")}{" "}
        <a
          href="/docs/theme-lifecycle-and-library"
          className="text-blue-600 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("cms.theme.importDesignSystem.themeLibraryTips")}
        </a>
        .
      </p>
    </div>
  );
}
