// src/components/guides/TableOfContents.tsx
import { createElement, memo, type ComponentPropsWithoutRef, type ElementType } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

const navClasses = [
  "not-prose",
  "relative",
  "mb-6",
  "overflow-hidden",
  "rounded-2xl",
  "border",
  "border-brand-outline/20",
  "bg-brand-surface/80",
  "p-5",
  "text-sm",
  "text-brand-heading",
  "shadow-lg",
  "ring-1",
  "ring-brand-outline/10",
  "backdrop-blur",
  "lg:p-6",
  "dark:border-brand-outline/40",
  "dark:bg-brand-bg/70",
  "dark:text-brand-surface",
  "dark:ring-brand-outline/25",
] as const;

const overlayClasses = [
  "pointer-events-none",
  "absolute",
  "inset-0",
  "bg-gradient-to-br",
  "from-brand-primary/10",
  "via-transparent",
  "to-brand-bougainvillea/10",
] as const;

const headingClasses = [
  "block",
  "text-xs",
  "font-semibold",
  "uppercase",
  "tracking-kicker",
  "text-brand-primary/80",
  "dark:text-brand-secondary/80",
] as const;

const gridClasses = ["mt-5", "gap-3", "sm:grid-cols-2"] as const;

const linkClasses = [
  "group",
  "w-full",
  "gap-3",
  "rounded-xl",
  "border",
  "border-brand-outline/20",
  "bg-brand-surface/60",
  "px-4",
  "py-3",
  "font-medium",
  "text-brand-heading",
  "no-underline",
  "shadow-sm",
  "transition",
  "duration-200",
  "ease-out",
  "hover:border-brand-primary/40",
  "hover:bg-brand-primary/10",
  "hover:text-brand-primary",
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-brand-primary/60",
  "focus-visible:ring-offset-2",
  "focus-visible:ring-offset-transparent",
  "dark:border-brand-outline/50",
  "dark:bg-brand-bg/60",
  "dark:text-brand-surface",
  "dark:hover:border-brand-primary/50",
  "dark:hover:bg-brand-primary/15",
  "dark:hover:text-brand-primary",
  "min-h-10",
] as const;

const indexClasses = [
  "inline-flex",
  "size-7",
  "flex-none",
  "items-center",
  "justify-center",
  "rounded-full",
  "bg-brand-primary/15",
  "text-xs",
  "font-semibold",
  "uppercase",
  "tracking-wider",
  "text-brand-primary",
  "transition",
  "duration-200",
  "group-hover:bg-brand-primary",
  "group-hover:text-brand-surface",
  "group-focus-visible:bg-brand-primary",
  "group-focus-visible:text-brand-surface",
  "before:inline-flex",
  "before:size-full",
  "before:items-center",
  "before:justify-center",
  "before:content-[attr(data-index)]",
] as const;

const labelClasses = ["flex-1", "text-start", "leading-snug"] as const;

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
    className: clsx("inline-flex", "items-center", className),
  });
}

type Item = {
  href: string; // e.g., #section-id
  label: string;
  key?: string;
};

type Props = {
  items: ReadonlyArray<Item>;
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
  const normalisedItems: ReadonlyArray<Item> = Array.isArray(items)
    ? items.map((it) => {
        if (typeof it?.href === "string" && it.href.trim() === "#faqs") {
          const current = typeof it.label === "string" ? it.label.trim() : "";
          if (current.toLowerCase() === "faqs" && faqsLabelFallback.trim().toLowerCase() !== "faqs") {
            return { ...it, label: faqsLabelFallback };
          }
        }
        return it;
      })
    : items;

  if (!normalisedItems?.length) return null;
  return (
    <nav
      aria-label={resolvedTitle}
      className={clsx(navClasses, className)}
      data-testid="toc"
      data-title={resolvedTitle}
    >
      <div className="relative">
        <div aria-hidden className={clsx(overlayClasses)} />
        <div className="relative">
          <strong className={clsx(headingClasses)}>
            {resolvedTitle}
          </strong>
          <Grid as="ol" className={clsx(gridClasses)}>
            {normalisedItems.map(({ href, label, key }, index) => {
              const baseKey = key ?? href ?? "toc-item";
              const itemKey = `${baseKey}::${index}`;
              const indexLabel = String(index + 1).padStart(2, "0");
              return (
                <li key={itemKey}>
                  <Inline
                    as="a"
                    className={clsx(linkClasses)}
                    href={href}
                    aria-posinset={index + 1}
                    aria-setsize={items.length}
                  >
                    <span
                      aria-hidden
                      className={clsx(indexClasses)}
                      data-index={indexLabel}
                    />
                    <span className={clsx(labelClasses)}>{label}</span>
                  </Inline>
                </li>
              );
            })}
          </Grid>
        </div>
      </div>
    </nav>
  );
}

export default memo(TableOfContents);
