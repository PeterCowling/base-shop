import clsx from "clsx";
import { memo, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import type { ScoreResult } from "./types";

type DecisionSummaryProps = {
  top: ScoreResult | null;
  className?: string;
};

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
        {t("romePlanner.reco.title")}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-brand-heading dark:text-brand-surface">{t(top.route.titleKey)}</h3>
      <p className="mt-1 text-sm text-brand-text/80 dark:text-brand-surface/80">{t(top.route.shortSummaryKey)}</p>
      {top.reasonKeys.length ? (
        <div className="mt-4 rounded-xl bg-brand-surface/80 p-4 dark:bg-brand-surface/30">
          <div className="text-sm font-semibold text-brand-heading dark:text-brand-surface">{t("romePlanner.reco.why")}</div>
          <ul className="mt-1 list-disc pl-5 text-sm text-brand-text/80 dark:text-brand-surface/70">
            {top.reasonKeys.map((key, index) => (
              <li key={index}>{t(key)}</li>
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
