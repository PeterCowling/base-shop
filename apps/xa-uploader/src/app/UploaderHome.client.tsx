"use client";

import CatalogConsole from "../components/catalog/CatalogConsole.client";
import { LanguageToggle } from "../components/LanguageToggle.client";
import { ThemeToggle } from "../components/ThemeToggle.client";
import { UploaderI18nProvider,useUploaderI18n } from "../lib/uploaderI18n.client";

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
      {/* Compact header strip */}
      <header className={`bg-gate-header ${styles.uploaderFade}`}>
        {/* eslint-disable-next-line ds/container-widths-only-at -- XAUP-0001 operator-tool page layout */}
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
          <h1 className="text-sm font-semibold text-gate-header-fg">{t("storefrontXAB")}</h1>
          <span className="text-sm text-gate-header-muted">&mdash;</span>
          <span className="text-sm font-medium text-gate-accent">{t("categoryBags")}</span>
          <span className="hidden text-2xs text-gate-header-muted sm:inline">{t("headerExpansionHint")}</span>
          <div className="ms-auto flex items-center gap-3">
            <ThemeToggle variant="dark" />
            <LanguageToggle monoClassName={monoClassName} variant="dark" />
          </div>
        </div>
      </header>

      {/* Content area */}
      <div className={`mx-auto max-w-6xl px-6 py-8 ${styles.uploaderFade}`}>
        <CatalogConsole monoClassName={monoClassName} />
      </div>
    </main>
  );
}
