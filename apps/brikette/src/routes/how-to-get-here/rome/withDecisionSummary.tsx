/* eslint-disable ds/no-hardcoded-copy -- LINT-1007 [ttl=2026-12-31] UI fallback copy retained while translation coverage is completed. */
import { type ComponentType,memo } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

import type { ScoreResult } from "./types";

type DecisionSummaryProps = {
  top: ScoreResult | null;
  className?: string;
};

function resolveTranslatedCopy(value: unknown, key: string, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (trimmed === key) return fallback;
  return trimmed;
}

export function DecisionSummary({ top, className }: DecisionSummaryProps) {
  const { t } = useTranslation("howToGetHere");

  if (!top) {
    return null;
  }

  const classes = clsx(
    "rounded-2xl",
    "border",
    "border-brand-outline/40",
    "bg-brand-surface/90",
    "p-5",
    "shadow-sm",
    "backdrop-blur-sm",
    "dark:border-brand-outline/50",
    "dark:bg-brand-surface/40",
    className,
  );

  return (
    <section className={classes}>
      <p className="text-sm font-bold uppercase tracking-wide text-brand-primary dark:text-brand-secondary">
        {resolveTranslatedCopy(
          t("romePlanner.reco.title", { defaultValue: "Best match for your picks" }),
          "romePlanner.reco.title",
          "Best match for your picks"
        )}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-brand-heading dark:text-brand-text">
        {resolveTranslatedCopy(t(top.route.titleKey, { defaultValue: "Route option" }), top.route.titleKey, "Route option")}
      </h3>
      <p className="mt-1 text-sm text-brand-text/80 dark:text-brand-text/80">
        {resolveTranslatedCopy(t(top.route.shortSummaryKey, { defaultValue: "" }), top.route.shortSummaryKey, "")}
      </p>
      {top.reasonKeys.length ? (
        <div className="mt-4 rounded-xl bg-brand-surface/80 p-4 dark:bg-brand-surface/30">
          <div className="text-sm font-semibold text-brand-heading dark:text-brand-text">
            {resolveTranslatedCopy(
              t("romePlanner.reco.why", { defaultValue: "Why this route?" }),
              "romePlanner.reco.why",
              "Why this route?"
            )}
          </div>
          <ul className="mt-1 list-disc pl-5 text-sm text-brand-text/80 dark:text-brand-text/70">
            {top.reasonKeys.map((key) => (
              <li key={key}>{resolveTranslatedCopy(t(key), key)}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export const withDecisionSummary = <P extends object>(
  Component: ComponentType<P>,
) =>
  memo(function WithDecisionSummary(props: P & { top: ScoreResult | null }) {
    const { top, ...rest } = props as { top: ScoreResult | null } & P;

    return (
      <>
        <DecisionSummary top={top} />
        <Component {...(rest as P)} />
      </>
    );
  });
