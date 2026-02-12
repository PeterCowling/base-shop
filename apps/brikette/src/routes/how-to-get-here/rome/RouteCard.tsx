import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { Cluster } from "../ui";

import { ProsCons } from "./ProsCons";
import type { RouteOption } from "./types";

interface RouteCardProps {
  route: RouteOption;
}

function resolveTranslatedCopy(value: unknown, key: string, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (trimmed === key) return fallback;
  return trimmed;
}

function RouteCardBase({ route }: RouteCardProps) {
  const { t, ready } = useTranslation("howToGetHere");
  const [open, setOpen] = useState(false);

  const tags = ready
    ? route.tagsKeys
        .map((key) => resolveTranslatedCopy(t(key), key))
        .filter((label) => Boolean(label))
    : [];
  const title = resolveTranslatedCopy(t(route.titleKey, { defaultValue: "Route option" }), route.titleKey, "Route option");
  const summary = resolveTranslatedCopy(t(route.shortSummaryKey, { defaultValue: "" }), route.shortSummaryKey, "");
  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  return (
    <article className="rounded-xl border border-brand-outline/30 bg-brand-surface p-4 shadow-sm dark:border-brand-outline/50 dark:bg-brand-surface/30">
      <Cluster as="div" className="flex-nowrap items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-brand-heading dark:text-brand-text">{title}</h3>
          {summary ? (
            <p className="mt-1 text-sm text-brand-text/80 dark:text-brand-text/80">{summary}</p>
          ) : null}
          {tags.length ? (
            <Cluster as="div" className="mt-2 gap-1">
              {tags.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-brand-outline/30 bg-brand-surface/70 px-2 py-0.5 text-xs text-brand-heading dark:border-brand-outline/50 dark:bg-brand-surface/30 dark:text-brand-text"
                >
                  {label}
                </span>
              ))}
            </Cluster>
          ) : null}
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
        className="min-h-11 min-w-11 rounded-md border border-brand-outline/30 bg-brand-surface px-3 py-1 text-sm font-medium text-brand-heading transition hover:bg-brand-surface/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary dark:border-brand-outline/50 dark:bg-brand-surface/30 dark:text-brand-text dark:hover:bg-brand-surface/40 dark:focus-visible:outline-brand-secondary"
        >
          {open
            ? resolveTranslatedCopy(
                t("romePlanner.ui.hideDetails", { defaultValue: "Hide details" }),
                "romePlanner.ui.hideDetails",
                "Hide details"
              )
            : resolveTranslatedCopy(
                t("romePlanner.ui.showDetails", { defaultValue: "Show details" }),
                "romePlanner.ui.showDetails",
                "Show details"
              )}
        </button>
      </Cluster>

      <div className="mt-4">
        <ProsCons prosKeys={route.prosKeys} consKeys={route.consKeys} />
      </div>

      {open ? (
        <div className="mt-4 space-y-3">
          {route.notesKeys.length ? (
            <div>
              <div className="text-sm font-semibold text-brand-heading dark:text-brand-text">
                {resolveTranslatedCopy(
                  t("romePlanner.ui.notes", { defaultValue: "Notes" }),
                  "romePlanner.ui.notes",
                  "Notes"
                )}
              </div>
              <ul className="mt-1 list-disc pl-5 text-sm text-brand-text/80 dark:text-brand-text/80">
                {route.notesKeys.map((key) => (
                  <li key={key}>{resolveTranslatedCopy(t(key), key)}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <div className="text-sm font-semibold text-brand-heading dark:text-brand-text">
              {resolveTranslatedCopy(
                t("romePlanner.ui.steps", { defaultValue: "Steps" }),
                "romePlanner.ui.steps",
                "Steps"
              )}
            </div>
            <ol className="mt-1 list-decimal pl-5 text-sm text-brand-text/80 dark:text-brand-text/80">
              {route.steps.map((step, index) => (
                <li key={`${route.id}-step-${index}`}>
                  {resolveTranslatedCopy(t(step.labelKey), step.labelKey)}
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export const RouteCard = memo(RouteCardBase);
