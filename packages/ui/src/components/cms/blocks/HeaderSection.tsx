"use client";

import React from "react";
import AnnouncementBar from "./AnnouncementBarBlock";
import SearchBar from "./SearchBar";
import CurrencySelector from "./CurrencySelector";
import LanguageSwitcher from "../../molecules/LanguageSwitcher";
import ExperimentGate from "../../ab/ExperimentGate";
import { getBreadcrumbs } from "@acme/platform-core/router/breadcrumbs";

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
  const stickyClass = variant === "sticky" ? "sticky top-0 z-50" : undefined;
  const transparentClass = variant === "transparent" ? "bg-transparent" : "bg-white";
  const [open, setOpen] = React.useState(false);

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
      const node = <div className="max-w-md flex-1"><SearchBar /></div>;
      return experimentKey ? (
        <ExperimentGate flag={`${experimentKey}:search`} fallback={null}>{node}</ExperimentGate>
      ) : node;
    }
    return (
      <>
        <ExperimentGate flag={experimentKey ? `${experimentKey}:search` : undefined}>
          <button aria-label="Open search" className="p-2" onClick={() => setOpen(true)}>🔎</button>
        </ExperimentGate>
        {open ? (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-8" onClick={() => setOpen(false)}>
            <div className="bg-white rounded shadow p-4 w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-medium">Search</h2>
                <button onClick={() => setOpen(false)}>✕</button>
              </div>
              <SearchBar />
            </div>
          </div>
        ) : null}
      </>
    );
  };

  return (
    <header className={[className, stickyClass, transparentClass, "w-full border-b"].filter(Boolean).join(" ") || undefined} {...rest}>
      {announcement ? (
        experimentKey ? (
          <ExperimentGate flag={`${experimentKey}:announcement`}><AnnouncementBar /></ExperimentGate>
        ) : (
          <AnnouncementBar />
        )
      ) : null}
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <a className="font-bold" href="/">Shop</a>
        {variant === "centerLogo" ? <div className="mx-auto" /> : null}
        <nav className="flex items-center gap-3 ml-auto">
          {renderSearch()}
          {showCurrencySelector ? (
            experimentKey ? (
              <ExperimentGate flag={`${experimentKey}:currency`}><CurrencySelector /></ExperimentGate>
            ) : (
              <CurrencySelector />
            )
          ) : null}
          {showLocaleSelector ? <LanguageSwitcher current={"en" as any} /> : null}
        </nav>
      </div>
      {showBreadcrumbs && breadcrumbs.length > 1 ? (
        <div className="mx-auto max-w-7xl px-4 pb-3 text-sm text-neutral-600">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              {breadcrumbs.map((c, i) => (
                <li key={c.href} className="flex items-center gap-2">
                  <a href={c.href} className="hover:underline">{c.label}</a>
                  {i < breadcrumbs.length - 1 ? <span>/</span> : null}
                </li>
              ))}
            </ol>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
