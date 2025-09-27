// apps/shop-bcd/src/components/NotFoundContent.tsx
"use client";

import { memo, type ReactElement } from "react";
import { useTranslations } from "@i18n/Translations";

function NotFoundContentInner(): ReactElement {
  const t = useTranslations();
  return (
    <div className="min-h-dvh grid place-items-center p-16 text-center">
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold leading-tight">{t("notFound.title")}</h1>
        <p className="text-base opacity-80">{t("notFound.desc")}</p>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-current px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 min-h-10 min-w-10"
        >
          {t("nav.home")}
        </a>
      </div>
    </div>
  );
}

export default memo(NotFoundContentInner);
