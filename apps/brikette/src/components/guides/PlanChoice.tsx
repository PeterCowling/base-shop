// src/components/guides/PlanChoice.tsx
import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import type { TFunction } from "i18next";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import type { AppLanguage } from "@/i18n.config";

type Option = "ferry" | "train-bus" | "transfer";

type Translator = TFunction;

const identityTranslator = ((key: string) => key) as Translator;

type Props = {
  onSelect?: (opt: Option) => void;
  className?: string;
  title?: string;
  lang?: AppLanguage;
};

type ClusterProps = JSX.IntrinsicElements["div"];

function Cluster({ className, ...rest }: ClusterProps): JSX.Element {
  const baseClass = clsx("flex", "flex-wrap", "gap-2");
  return <div className={clsx(baseClass, className)} {...rest} />;
}

function PlanChoice({ onSelect, className = "", title, lang: explicitLang }: Props): JSX.Element {
  const fallbackLang = useCurrentLanguage();
  const lang = explicitLang ?? fallbackLang;
  // Hooks must be called at the top level of the component.
  const translationHook = useTranslation("guides", { lng: lang, useSuspense: false }) as {
    t?: unknown;
    ready?: boolean;
  };
  const ready = Boolean(translationHook?.ready);
  const translatorCandidate = translationHook?.t;
  // Unit tests sometimes render without wiring the i18next provider; default to
  // an identity translator so the component continues rendering fallback copy.
  const t = useMemo<Translator>(() => {
    if (!ready) {
      return identityTranslator;
    }
    if (typeof translatorCandidate === "function") {
      return translatorCandidate as Translator;
    }
    return identityTranslator;
  }, [translatorCandidate, ready]);
  const [choice, setChoice] = useState<Option | null>(null);

  const optionLabels = useMemo<Record<Option, string>>(
    () => ({
      ferry: t("components.planChoice.options.ferry"),
      "train-bus": t("components.planChoice.options.trainBus"),
      transfer: t("components.planChoice.options.transfer"),
    }),
    [t]
  );

  const heading = title ?? t("components.planChoice.title");
  const selectedLabel = t("components.planChoice.selectedLabel");

  function pick(opt: Option) {
    setChoice(opt);
    // Fire a lightweight CustomEvent for analytics hooks (guarded for non-browser environments)
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent("plan-choice", { detail: { plan: opt } }));
    }
    onSelect?.(opt);
  }

  const base = clsx(
    "inline-flex",
    "items-center",
    "rounded-md",
    "border",
    "px-3",
    "py-2",
    "text-sm",
    "transition-colors",
    "focus:outline-none",
    "focus:ring-2",
    "focus:ring-offset-2",
    "disabled:opacity-60"
  );
  const activeClasses = clsx(
    "border-brand-primary",
    "bg-brand-primary/10",
    "text-brand-primary",
    "dark:border-brand-primary/70",
    "dark:bg-brand-primary/20",
    "dark:text-brand-primary/80"
  );
  const inactiveClasses = clsx(
    "border-brand-outline/30",
    "text-brand-text/90",
    "hover:bg-brand-surface",
    "dark:border-brand-outline/60",
    "dark:text-brand-text",
    "dark:hover:bg-brand-surface/60"
  );

  function btn(opt: Option) {
    const active = choice === opt;
    const label = optionLabels[opt];
    return (
      <button
        key={opt}
        type="button"
        onClick={() => pick(opt)}
        className={clsx(base, active ? activeClasses : inactiveClasses)}
        aria-pressed={active}
      >
        {active ? "✓ " : ""}
        {label}
      </button>
    );
  }

  return (
    <div
      className={clsx(
        "not-prose",
        "my-6",
        "rounded-lg",
        "border",
        "border-brand-outline/20",
        "p-4",
        "dark:border-brand-outline/50",
        className
      )}
    >
      <p className="mb-3 text-sm font-medium">{heading}</p>
      <Cluster>
        {btn("ferry")}
        {btn("train-bus")}
        {btn("transfer")}
      </Cluster>
      {choice && (
        <p className="mt-3 text-xs text-brand-text/70 dark:text-brand-text/80">
          {selectedLabel} <strong>{optionLabels[choice]}</strong>
        </p>
      )}
    </div>
  );
}

export type { Option as PlanChoiceOption };
export default memo(PlanChoice);
