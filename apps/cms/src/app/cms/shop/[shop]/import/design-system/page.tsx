"use client";
import { useEffect } from "react";
import { track } from "@acme/telemetry";
import { useTranslations } from "@acme/i18n";

export default function DesignSystemImportPage() {
  useEffect(() => {
    track("designsystem:import:view", {});
  }, []);
  const t = useTranslations();
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">{t("cms.theme.importDesignSystem")}</h2>
      <p className="text-sm">{t("cms.theme.importDesc")}</p>
      <p className="mt-2 text-xs">
        <a
          href="/docs/design-system-package-import"
          className="text-blue-600 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("cms.theme.packageGuide")}
        </a>{" "}
        {t("cms.and")}{" "}
        <a
          href="/docs/theme-lifecycle-and-library"
          className="text-blue-600 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("cms.theme.libraryTips")}
        </a>
        .
      </p>
    </div>
  );
}
