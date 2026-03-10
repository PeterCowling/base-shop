"use client";

import type { ReactNode } from "react";

import { LanguageToggle } from "../components/LanguageToggle.client";
import { ThemeToggle } from "../components/ThemeToggle.client";
import { UploaderI18nProvider, useUploaderI18n } from "../lib/uploaderI18n.client";

import styles from "./uploader.module.css";

type UploaderShellProps = {
  displayClassName: string;
  monoClassName: string;
  headerExtra?: ReactNode;
  children: ReactNode;
};

export default function UploaderShell({
  displayClassName,
  monoClassName,
  headerExtra,
  children,
}: UploaderShellProps) {
  return (
    <UploaderI18nProvider>
      <UploaderShellInner
        displayClassName={displayClassName}
        monoClassName={monoClassName}
        headerExtra={headerExtra}
      >
        {children}
      </UploaderShellInner>
    </UploaderI18nProvider>
  );
}

function UploaderShellInner({
  displayClassName,
  monoClassName,
  headerExtra,
  children,
}: UploaderShellProps) {
  const { t } = useUploaderI18n();

  return (
    <main className={`${displayClassName} relative min-h-dvh overflow-hidden bg-gate-bg text-gate-ink`}>
      <header className={`bg-gate-header border-b border-gate-header-accent ${styles.uploaderFade}`}>
        {/* eslint-disable-next-line ds/container-widths-only-at -- XAUP-0001 operator-tool page layout */}
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
          <h1 className="text-sm font-semibold text-gate-header-fg">{t("storefrontXAB")}</h1>
          <span className="rounded bg-gate-accent px-2 py-0.5 text-2xs font-semibold uppercase tracking-label text-gate-on-accent">{t("categoryBags")}</span>
          <span className="hidden text-2xs text-gate-header-muted sm:inline">{t("headerExpansionHint")}</span>
          <div className="ms-auto flex items-center gap-3">
            {headerExtra}
            <ThemeToggle variant="dark" />
            <LanguageToggle monoClassName={monoClassName} variant="dark" />
          </div>
        </div>
      </header>

      <div className={`mx-auto max-w-6xl px-6 py-8 ${styles.uploaderFade}`}>{children}</div>
    </main>
  );
}
