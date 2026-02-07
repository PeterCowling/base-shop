"use client";

import React from "react";

import { useTranslations } from "@acme/i18n";
import { resolveLocale } from "@acme/i18n/locales";
import { getBreadcrumbs } from "@acme/platform-core/router/breadcrumbs";

import ExperimentGate from "../../ab/ExperimentGate";
import { Cluster, Cover } from "../../atoms/primitives";
import LanguageSwitcher from "../../molecules/LanguageSwitcher";

import AnnouncementBar from "./AnnouncementBarBlock";
import CurrencySelector from "./CurrencySelector";
import SearchBar from "./SearchBar";

export interface HeaderSectionProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "minimal" | "centerLogo" | "splitUtilities" | "transparent" | "sticky";
  announcement?: boolean;
  searchMode?: "inline" | "iconOverlay" | "off";
  showBreadcrumbs?: boolean;
  showCurrencySelector?: boolean;
  showLocaleSelector?: boolean;
  titleForBreadcrumbs?: string;
  /** Optional experiment key; will gate sub-elements using derived flags */
  experimentKey?: string;
}

export default function HeaderSection({
  variant = "minimal",
  announcement = false,
  searchMode = "inline",
  showBreadcrumbs = false,
  showCurrencySelector = false,
  showLocaleSelector = false,
  titleForBreadcrumbs,
  experimentKey,
  className,
  ...rest
}: HeaderSectionProps) {
  const t = useTranslations();
  // i18n-exempt -- DS-1023: CSS utility class names, not user copy [ttl=2026-12-31]
  const stickyClass = variant === "sticky" ? "sticky top-0 z-50" : undefined;
  // i18n-exempt -- DS-1023: CSS utility class names, not user copy [ttl=2026-12-31]
  const transparentClass = variant === "transparent" ? "bg-transparent" : "bg-background text-foreground";
  const [open, setOpen] = React.useState(false);
  // Resolve current locale for LanguageSwitcher
  // falls back to "en" when window is undefined
  // i18n-exempt -- DS-1026: Locale derivation from path; not user-facing copy [ttl=2026-12-31]
  const currentLocale = React.useMemo(() => {
    try {
      const seg = typeof window !== "undefined" ? window.location.pathname.split("/")[1] : "en";
      return resolveLocale(seg);
    } catch {
      return "en" as const;
    }
  }, []);

  const breadcrumbs = React.useMemo(() => {
    if (!showBreadcrumbs) return [] as ReturnType<typeof getBreadcrumbs>;
    try {
      const path = typeof window !== "undefined" ? window.location.pathname : "/";
      return getBreadcrumbs(path, titleForBreadcrumbs);
    } catch {
      return [];
    }
  }, [showBreadcrumbs, titleForBreadcrumbs]);

  const renderSearch = () => {
    if (searchMode === "off") return null;
    if (searchMode === "inline") {
      const node = <div className="flex-1 sm:w-96"><SearchBar /></div>;
      return experimentKey ? (
        <ExperimentGate flag={`${experimentKey}:search`} fallback={null}>{node}</ExperimentGate>
      ) : node;
    }
    return (
      <div className="relative">
        <ExperimentGate flag={experimentKey ? `${experimentKey}:search` : undefined}>
          <button aria-label={String(t("header.openSearch"))} className="p-2 min-h-10 min-w-10" onClick={() => setOpen(true)}>
            <span aria-hidden>🔎</span> {/* i18n-exempt -- DS-1027: icon glyph only [ttl=2026-12-31] */}
          </button>
        </ExperimentGate>
        {open ? (
          <div
            className="fixed inset-0 bg-foreground/50 p-8"
            role="button"
            aria-label={String(t("actions.close"))}
            tabIndex={0}
            onClick={(e) => {
              if (e.currentTarget === e.target) setOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape" || e.key === "Enter" || e.key === " ") setOpen(false);
            }}
          >
            <Cover minH="screen" center={
              <div
                className="w-full rounded-lg border border-border bg-card p-4 shadow-sm"
                role="dialog"
                aria-modal="true"
                aria-labelledby="search-title"
              >
                <Cluster justify="between" alignY="center" className="mb-2">
                  <h2 id="search-title" className="font-medium">{t("header.search")}</h2>
                  <button aria-label={String(t("actions.close"))} className="min-h-10 min-w-10" onClick={() => setOpen(false)}>
                    <span aria-hidden>✕</span> {/* i18n-exempt -- DS-1027: icon glyph only [ttl=2026-12-31] */}
                  </button>
                </Cluster>
                <SearchBar />
              </div>
            } />
          </div>
        ) : null}
      </div>
    );
  };

  return (
     
    <header className={[className, stickyClass, transparentClass, "relative w-full border-b border-border"].filter(Boolean).join(" ") || undefined} {...rest}>
      {announcement ? (
        experimentKey ? (
          <ExperimentGate flag={`${experimentKey}:announcement`}><AnnouncementBar /></ExperimentGate>
        ) : (
          <AnnouncementBar />
        )
      ) : null}
      <div className="relative mx-auto px-4 py-3">
        <Cluster alignY="center" gap={4}>
          <a className="font-bold inline-flex items-center min-h-10 min-w-10" href="/">{t("header.brand")}</a>
          {variant === "centerLogo" ? <div className="mx-auto" /> : null}
          <nav className="ms-auto">
            <Cluster alignY="center" gap={3}>
              {renderSearch()}
              {showCurrencySelector ? (
                experimentKey ? (
                  <ExperimentGate flag={`${experimentKey}:currency`}><CurrencySelector /></ExperimentGate>
                ) : (
                  <CurrencySelector />
                )
              ) : null}
              {showLocaleSelector ? <LanguageSwitcher current={currentLocale} /> : null}
            </Cluster>
          </nav>
        </Cluster>
      </div>
      {showBreadcrumbs && breadcrumbs.length > 1 ? (
        <div className="mx-auto px-4 pb-3 text-sm text-muted-foreground">
          <nav aria-label={String(t("breadcrumb.ariaLabel"))}>
            <ol>
              {breadcrumbs.map((c: { href: string; label: string }, i: number) => (
                <li key={c.href} className="inline-block align-middle me-2 last:me-0">
                  <a href={c.href} className="inline-flex items-center min-h-10 min-w-10 hover:underline px-1">{c.label}</a> {/* i18n-exempt -- DS-1024: dynamic route labels provided by router [ttl=2026-12-31] */}
                  {i < breadcrumbs.length - 1 ? <span className="mx-1" aria-hidden>/</span> : null} {/* i18n-exempt -- DS-1027: separator glyph only [ttl=2026-12-31] */}
                </li>
              ))}
            </ol>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
