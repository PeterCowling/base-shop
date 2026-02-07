// src/components/guides/TableOfContents.tsx
import { type ComponentPropsWithoutRef, createElement, type ElementType, memo, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

import {
  chevronClasses,
  currentChevronClasses,
  currentIndexClasses,
  currentLinkClasses,
  gridClasses,
  headingClasses,
  headingWrapClasses,
  inactiveChevronClasses,
  inactiveLinkClasses,
  indexClasses,
  labelClasses,
  linkClasses,
  navClasses,
} from "./tableOfContentsStyles";

type GridProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

function Grid<T extends ElementType = "div">({ as, className, ...props }: GridProps<T>) {
  return createElement(as ?? "div", {
    ...props,
    className: clsx("grid", className),
  });
}

type InlineProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

function Inline<T extends ElementType = "div">({ as, className, ...props }: InlineProps<T>) {
  return createElement(as ?? "div", {
    ...props,
    className: clsx("flex", className),
  });
}

type Item = {
  href: string; // e.g., #section-id
  label: string;
  key?: string;
};

type Props = {
  items?: ReadonlyArray<Item>;
  title?: string;
  className?: string;
};

const DEFAULT_TOC_TITLE = "On this page";

function resolveTitle(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") {
    return fallback;
  }
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "labels.onThisPage") {
    return fallback;
  }
  return trimmed;
}

function TableOfContents({ items, title, className = "" }: Props): JSX.Element | null {
  // Be resilient to tests that don't mock every useTranslation() call.
  const translationHook = useTranslation("guides") as
    | { t?: (key: string, options?: Record<string, unknown>) => unknown }
    | undefined;
  const t =
    typeof translationHook?.t === "function"
      ? translationHook.t
      : (key: string, options?: Record<string, unknown>) =>
          (options && Object.prototype.hasOwnProperty.call(options, "defaultValue")
            ? (options as { defaultValue?: unknown }).defaultValue
            : key);
  const translatedTitle = t("labels.onThisPage", { defaultValue: DEFAULT_TOC_TITLE }) as string;
  const fallbackTitle = resolveTitle(translatedTitle, DEFAULT_TOC_TITLE);
  const resolvedTitle = resolveTitle(title, fallbackTitle);
  // Normalise FAQs label in ToC to use the same fallback as the section
  // heading when available, so both match across locales/tests.
  const faqsLabelFallback = ((): string => {
    const raw = t("labels.faqsHeading", { defaultValue: "FAQs" }) as string;
    return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : "FAQs";
  })();

  const normalisedItems = useMemo<ReadonlyArray<Item>>(
    () =>
      (Array.isArray(items) ? items : []).map((it) => {
        if (typeof it?.href === "string" && it.href.trim() === "#faqs") {
          const current = typeof it.label === "string" ? it.label.trim() : "";
          if (current.toLowerCase() === "faqs" && faqsLabelFallback.trim().toLowerCase() !== "faqs") {
            return { ...it, label: faqsLabelFallback };
          }
        }
        return it;
      }),
    [faqsLabelFallback, items],
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const browser = typeof globalThis.window !== "undefined" ? globalThis.window : undefined;
    if (!browser) return;

    const ids = normalisedItems
      .map((item) => (typeof item.href === "string" && item.href.startsWith("#") ? item.href.slice(1) : ""))
      .filter((value): value is string => Boolean(value));

    if (ids.length === 0) return;

    const setFromHash = () => {
      const hash = browser.location.hash?.replace(/^#/, "");
      if (hash && ids.includes(hash)) {
        setActiveId(hash);
      }
    };

    setFromHash();

    if (!("IntersectionObserver" in browser)) {
      (browser as Window).addEventListener("hashchange", setFromHash);
      return () => {
        (browser as Window).removeEventListener("hashchange", setFromHash);
      };
    }

    const sections = ids
      .map((id) => browser.document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (sections.length === 0) {
      browser.addEventListener("hashchange", setFromHash);
      return () => {
        browser.removeEventListener("hashchange", setFromHash);
      };
    }

    let frame = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible?.target?.id) return;

        if (frame) cancelAnimationFrame(frame);
        frame = browser.requestAnimationFrame(() => setActiveId(visible.target.id));
      },
      {
        // i18n-exempt -- TECH-000 [ttl=2026-12-31] Layout constant (IntersectionObserver margin)
        rootMargin: "-25% 0px -60% 0px",
        threshold: [0.01, 0.1, 0.25, 0.5, 0.75],
      },
    );

    sections.forEach((section) => observer.observe(section));
    browser.addEventListener("hashchange", setFromHash);

    return () => {
      observer.disconnect();
      browser.removeEventListener("hashchange", setFromHash);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [normalisedItems]);

  if (!normalisedItems?.length) return null;
  return (
    <nav
      aria-label={resolvedTitle}
      className={clsx(navClasses, className)}
      data-testid="toc"
      data-title={resolvedTitle}
    >
      <div className={clsx(headingWrapClasses)}>
        <h2 className={clsx(headingClasses)}>{resolvedTitle}</h2>
      </div>
      <Grid as="ol" className={clsx(gridClasses)}>
        {normalisedItems.map(({ href, label, key }, index) => {
          const baseKey = key ?? href ?? "toc-item";
          const itemKey = `${baseKey}::${index}`;
          const indexLabel = String(index + 1).padStart(2, "0");
          const hrefId = typeof href === "string" && href.startsWith("#") ? href.slice(1) : "";
          const isCurrent = Boolean(hrefId) && hrefId === activeId;
          return (
            <li key={itemKey}>
              <Inline
                as="a"
                className={clsx(
                  linkClasses,
                  isCurrent ? currentLinkClasses : inactiveLinkClasses,
                )}
                href={href}
                aria-current={isCurrent ? "location" : undefined}
                aria-posinset={index + 1}
                aria-setsize={normalisedItems.length}
                onClick={() => {
                  if (hrefId) setActiveId(hrefId);
                }}
              >
                <span
                  aria-hidden
                  className={clsx(indexClasses, isCurrent && currentIndexClasses)}
                >
                  {indexLabel}
                </span>
                <span className={clsx(labelClasses)}>{label}</span>
                <span
                  aria-hidden
                  className={clsx(
                    chevronClasses,
                    isCurrent ? currentChevronClasses : inactiveChevronClasses,
                  )}
                >
                  &gt;
                </span>
              </Inline>
            </li>
          );
        })}
      </Grid>
    </nav>
  );
}

export default memo(TableOfContents);
