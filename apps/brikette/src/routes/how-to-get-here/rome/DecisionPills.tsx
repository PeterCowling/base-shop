import { memo, useCallback, useId } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

import { Cluster, Inline } from "../ui";

import type { PreferenceKey } from "./types";

interface DecisionPillsProps {
  selected: ReadonlySet<PreferenceKey>;
  onToggle: (key: PreferenceKey) => void;
}

const PREFERENCES: { key: PreferenceKey; labelKey: string; descriptionKey: string }[] = [
  {
    key: "cheapest",
    labelKey: "romePlanner.pref.cheapest.label",
    descriptionKey: "romePlanner.pref.cheapest.description",
  },
  {
    key: "scenic",
    labelKey: "romePlanner.pref.scenic.label",
    descriptionKey: "romePlanner.pref.scenic.description",
  },
  {
    key: "heavy_luggage",
    labelKey: "romePlanner.pref.heavy_luggage.label",
    descriptionKey: "romePlanner.pref.heavy_luggage.description",
  },
];

const PRIMARY_PREFERENCES = PREFERENCES.slice(0, 2);
const SECONDARY_PREFERENCE = PREFERENCES[2];

function DecisionPillsBase({ selected, onToggle }: DecisionPillsProps) {
  const { t } = useTranslation("howToGetHere");
  const toggleLabelId = useId();
  const heavyLabelId = useId();
  const secondary = SECONDARY_PREFERENCE;
  const handleToggle = useCallback(
    (key: PreferenceKey) => {
      onToggle(key);
    },
    [onToggle],
  );

  return (
    <div className="mb-6 space-y-4">
      <div className="space-y-2">
        <span
          id={toggleLabelId}
          className="text-sm font-medium text-brand-heading/80 dark:text-brand-surface/80"
        >
          {t("romePlanner.pref.prompt")}
        </span>
        <Inline
          role="group"
          aria-labelledby={toggleLabelId}
          className="rounded-full border border-brand-outline/20 bg-brand-surface/90 p-1 shadow-sm dark:border-brand-outline/40 dark:bg-brand-surface/40"
        >
          {PRIMARY_PREFERENCES.map(({ key, labelKey }) => {
            const active = selected.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleToggle(key)}
                aria-pressed={active}
                className={clsx(
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
                  active
                    ? [
                        "bg-brand-primary/85",
                        "text-brand-surface",
                        "shadow-sm",
                        "dark:bg-brand-secondary/85",
                        "dark:text-brand-text",
                      ]
                    : [
                        "text-brand-text/80",
                        "hover:text-brand-heading",
                        "dark:text-brand-surface/80",
                        "dark:hover:text-brand-surface",
                      ],
                )}
              >
                {t(labelKey)}
              </button>
            );
          })}
        </Inline>
      </div>

      <Cluster as="div" className="items-center gap-3">
        <span
          id={heavyLabelId}
          className="text-sm font-medium text-brand-heading/80 dark:text-brand-surface/80"
        >
          {t("romePlanner.pref.heavyPrefix")}
        </span>
        {secondary
          ? (() => {
          const { key, labelKey } = secondary;
          const active = selected.has(key);
          return (
            <button
              type="button"
              onClick={() => handleToggle(key)}
              aria-pressed={active}
              className={clsx(
                "rounded-full",
                "border",
                "px-3",
                "py-1",
                "text-sm",
                "font-medium",
                "transition",
                "focus-visible:outline",
                "focus-visible:outline-2",
                "focus-visible:outline-offset-2",
                "focus-visible:outline-brand-primary",
                "dark:focus-visible:outline-brand-secondary",
                active
                  ? [
                      "border-brand-primary",
                      "bg-brand-primary/85",
                      "text-brand-surface",
                      "shadow-sm",
                      "dark:border-brand-secondary",
                      "dark:bg-brand-secondary/85",
                      "dark:text-brand-text",
                    ]
                  : [
                      "border-brand-outline/20",
                      "bg-brand-surface",
                      "text-brand-heading/80",
                      "hover:border-brand-primary/40",
                      "hover:text-brand-heading",
                      "dark:border-brand-outline/40",
                      "dark:bg-brand-surface/40",
                      "dark:text-brand-surface/80",
                      "dark:hover:border-brand-secondary/50",
                      "dark:hover:text-brand-surface",
                    ],
              )}
            >
              {t(labelKey)}
            </button>
          );
        })()
          : null}
      </Cluster>
    </div>
  );
}

export const DecisionPills = memo(DecisionPillsBase);
