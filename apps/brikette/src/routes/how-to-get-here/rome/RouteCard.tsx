import { memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Cluster } from "../ui";

import { ProsCons } from "./ProsCons";
import type { RouteOption } from "./types";

interface RouteCardProps {
  route: RouteOption;
}

function RouteCardBase({ route }: RouteCardProps) {
  const { t, ready } = useTranslation("howToGetHere");
  const [open, setOpen] = useState(false);

  const tags = useMemo(() => (ready ? route.tagsKeys.map((key) => t(key)) : []), [ready, route.tagsKeys, t]);
  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  return (
    <article className="rounded-xl border border-brand-outline/30 bg-brand-surface p-4 shadow-sm dark:border-brand-outline/50 dark:bg-brand-surface/30">
      <Cluster as="div" className="flex-nowrap items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-brand-heading dark:text-brand-surface">{t(route.titleKey)}</h3>
          <p className="mt-1 text-sm text-brand-text/80 dark:text-brand-surface/80">{t(route.shortSummaryKey)}</p>
          {tags.length ? (
            <Cluster as="div" className="mt-2 gap-1">
              {tags.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-brand-outline/30 bg-brand-surface/70 px-2 py-0.5 text-xs text-brand-heading dark:border-brand-outline/50 dark:bg-brand-surface/30 dark:text-brand-surface"
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
          className="min-h-11 min-w-11 rounded-md border border-brand-outline/30 bg-brand-surface px-3 py-1 text-sm font-medium text-brand-heading transition hover:bg-brand-surface/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary dark:border-brand-outline/50 dark:bg-brand-surface/30 dark:text-brand-surface dark:hover:bg-brand-surface/40 dark:focus-visible:outline-brand-secondary"
        >
          {open ? t("romePlanner.ui.hideDetails") : t("romePlanner.ui.showDetails")}
        </button>
      </Cluster>

      <div className="mt-4">
        <ProsCons prosKeys={route.prosKeys} consKeys={route.consKeys} />
      </div>

      {open ? (
        <div className="mt-4 space-y-3">
          {route.notesKeys.length ? (
            <div>
              <div className="text-sm font-semibold text-brand-heading dark:text-brand-surface">{t("romePlanner.ui.notes")}</div>
              <ul className="mt-1 list-disc pl-5 text-sm text-brand-text/80 dark:text-brand-surface/80">
                {route.notesKeys.map((key) => (
                  <li key={key}>{t(key)}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <div className="text-sm font-semibold text-brand-heading dark:text-brand-surface">{t("romePlanner.ui.steps")}</div>
            <ol className="mt-1 list-decimal pl-5 text-sm text-brand-text/80 dark:text-brand-surface/80">
              {route.steps.map((step, index) => (
                <li key={`${route.id}-step-${index}`}>{t(step.labelKey)}</li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export const RouteCard = memo(RouteCardBase);
