"use client";

import CatalogConsole from "../components/catalog/CatalogConsole.client";
import { LanguageToggle } from "../components/LanguageToggle.client";
import { UploaderI18nProvider, useUploaderI18n } from "../lib/uploaderI18n.client";

import styles from "./uploader.module.css";

export default function UploaderHomeClient({
  displayClassName,
  monoClassName,
}: {
  displayClassName: string;
  monoClassName: string;
}) {
  return (
    <UploaderI18nProvider>
      <UploaderHomeInner displayClassName={displayClassName} monoClassName={monoClassName} />
    </UploaderI18nProvider>
  );
}

function UploaderHomeInner({
  displayClassName,
  monoClassName,
}: {
  displayClassName: string;
  monoClassName: string;
}) {
  const { t } = useUploaderI18n();

  return (
    <main
      className={`${displayClassName} relative min-h-dvh overflow-hidden bg-gate-bg text-gate-ink`}
    >
      {/* eslint-disable-next-line ds/container-widths-only-at -- XAUP-0001 operator-tool page layout */}
      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col justify-center px-6 py-16">
        <div className={`space-y-3 ${styles.uploaderFade}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className={`text-xs uppercase tracking-label-xl ${monoClassName}`}>
              {t("pageKicker")}
            </div>
            <LanguageToggle monoClassName={monoClassName} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold md:text-4xl">{t("pageTitle")}</h1>
          </div>
          {/* eslint-disable-next-line ds/container-widths-only-at -- XAUP-0001 operator-tool prose width */}
          <p className="max-w-2xl text-sm text-gate-muted">
            {t("pageSubtitle")}
          </p>
        </div>

        <div className={`mt-10 ${styles.uploaderFade}`}>
          <CatalogConsole monoClassName={monoClassName} />
        </div>
      </div>
    </main>
  );
}
