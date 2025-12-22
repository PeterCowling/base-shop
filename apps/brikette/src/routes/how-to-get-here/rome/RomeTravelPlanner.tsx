import clsx from "clsx";
import { memo, useCallback, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Direction, PreferenceKey, RouteOption } from "./types";
 
import { DecisionPills } from "./DecisionPills";
import { Cluster, Inline } from "../ui";
import { useRomeRouteFilter } from "./useRomeRouteFilter";
import { RouteCard } from "./RouteCard";
import { DecisionSummary } from "./withDecisionSummary";

interface RouteListProps {
  routes: RouteOption[];
}

function RouteListBase({ routes }: RouteListProps) {
  return (
    <div className="space-y-4">
      {routes.map((route) => (
        <RouteCard key={route.id} route={route} />
      ))}
    </div>
  );
}

const RouteList = memo(RouteListBase);

const directionButtonBaseClass = [
  "rounded-full",
  "px-4",
  "py-1.5",
  "text-sm",
  "font-medium",
  "transition",
  "focus-visible:outline",
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-brand-primary",
  "dark:focus-visible:outline-brand-secondary",
];
const directionButtonActiveClass = [
  "bg-brand-primary/85",
  "text-brand-surface",
  "shadow-sm",
  "dark:bg-brand-secondary/85",
  "dark:text-brand-text",
];
const directionButtonInactiveClass = [
  "text-brand-text/80",
  "hover:text-brand-heading",
  "dark:text-brand-surface/80",
  "dark:hover:text-brand-surface",
];

export const RomeTravelPlanner = memo(function RomeTravelPlanner() {
  const { t } = useTranslation("howToGetHere");
  const [direction, setDirection] = useState<Direction>("from-rome");
  const [selected, setSelected] = useState<ReadonlySet<PreferenceKey>>(new Set());

  const onTogglePreference = useCallback((key: PreferenceKey) => {
    setSelected((prev) => {
      const next = new Set(prev);

      if (key === "cheapest" || key === "scenic") {
        const counterpart = key === "cheapest" ? "scenic" : "cheapest";
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.delete(counterpart);
          next.add(key);
        }
        return next;
      }

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const onSwitchDirection = useCallback((value: Direction) => {
    setDirection(value);
  }, []);

  const directionLabelId = useId();

  const { routes, top } = useRomeRouteFilter({ direction, selected });
  const visibleRoutes = useMemo(() => {
    if (!top) {
      return routes;
    }

    return routes.filter((route) => route.id !== top.route.id);
  }, [routes, top]);
  const isFromRome = direction === "from-rome";

  return (
    <section className="space-y-6">
      <div className="relative isolate overflow-hidden rounded-3xl border border-brand-outline/20 bg-gradient-to-br from-brand-primary/10 via-brand-surface to-brand-surface p-6 shadow-lg dark:border-brand-outline/40 dark:from-brand-secondary/20 dark:via-brand-surface/40 dark:to-brand-surface/30">
        <header className="border-b border-brand-outline/10 pb-4 dark:border-brand-outline/30">
          <h2 className="text-2xl font-semibold text-brand-heading dark:text-brand-surface">
            {t("romePlanner.title")}
          </h2>
          <p className="mt-1 text-sm text-brand-text/80 dark:text-brand-surface/70">
            {t("romePlanner.subtitle")}
          </p>
        </header>

        <Cluster as="div" className="mt-4 items-center gap-3">
          <span
            id={directionLabelId}
            className="text-sm font-medium text-brand-heading/80 dark:text-brand-surface/80"
          >
            {t("romePlanner.directionPrompt")}
          </span>
          <Inline
            role="group"
            aria-labelledby={directionLabelId}
            className="rounded-full border border-brand-outline/20 bg-brand-surface/90 p-1 shadow-sm dark:border-brand-outline/40 dark:bg-brand-surface/40"
          >
            <button
              type="button"
              onClick={() => onSwitchDirection("from-rome")}
              className={clsx(
                directionButtonBaseClass,
                isFromRome ? directionButtonActiveClass : directionButtonInactiveClass,
              )}
              aria-pressed={isFromRome}
            >
              {t("romePlanner.tabs.from")}
            </button>
            <button
              type="button"
              onClick={() => onSwitchDirection("to-rome")}
              className={clsx(
                directionButtonBaseClass,
                !isFromRome ? directionButtonActiveClass : directionButtonInactiveClass,
              )}
              aria-pressed={!isFromRome}
            >
              {t("romePlanner.tabs.to")}
            </button>
          </Inline>
        </Cluster>

        <DecisionPills selected={selected} onToggle={onTogglePreference} />

        <DecisionSummary className="mt-6" top={top} />
      </div>

      <div className="rounded-3xl border border-brand-outline/20 bg-brand-surface p-6 shadow-sm dark:border-brand-outline/40 dark:bg-brand-surface/30">
        <p className="text-sm font-bold uppercase tracking-wide text-brand-primary dark:text-brand-secondary">
          {t("romePlanner.otherMatches")}
        </p>
        <div className="mt-4">
          <RouteList routes={visibleRoutes} />
        </div>
      </div>

      <p className="text-center text-xs text-brand-text/60 dark:text-brand-surface/60">
        {t("romePlanner.disclaimer")}
      </p>
    </section>
  );
});
