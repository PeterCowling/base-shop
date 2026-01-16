// apps/cms/src/app/cms/configurator/components/ConfiguratorStepList.tsx
"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircledIcon,
  ResetIcon,
  TokensIcon,
  ImageIcon,
  LockClosedIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { Tag } from "@acme/ui/components/atoms";
import { Grid } from "@acme/ui/components/atoms/primitives";
import type { ConfiguratorState } from "../../wizard/schema";
import type { ConfiguratorStep, ConfiguratorStepTrack } from "../types";
import { getStepTrackMeta } from "../steps";
import { cn } from "@acme/ui/utils/style";
import { ButtonElement, CardRoot, CardSection } from "./DashboardPrimitives";
import { useTranslations } from "@acme/i18n";

interface Props {
  state: ConfiguratorState;
  steps: ConfiguratorStep[];
  skipStep: (id: string) => void;
  resetStep: (id: string) => void;
  onStepClick: (step: ConfiguratorStep) => void;
}

type TagVariant = "default" | "success" | "warning" | "destructive";

const TOUR_TARGETS: Record<string, string> = {
  "shop-details": "quest-basics",
  theme: "quest-theme",
  "payment-provider": "quest-payments",
  shipping: "quest-shipping",
  inventory: "quest-product",
  "checkout-page": "quest-checkout",
};

function useStatusCopy() {
  const t = useTranslations();
  const map: Record<string, { label: string; variant: TagVariant }> = {
    complete: { label: String(t("cms.configurator.status.complete")), variant: "success" },
    skipped: { label: String(t("cms.configurator.status.skipped")), variant: "warning" },
    pending: { label: String(t("cms.configurator.status.pending")), variant: "default" },
  };
  return map;
}

function TrackIcon({ track }: { track?: ConfiguratorStepTrack }) {
  const className = "h-8 w-8";
  switch (track) {
    case "foundation":
      return <TokensIcon className={className} aria-hidden />;
    case "experience":
      return <ImageIcon className={className} aria-hidden />;
    case "operations":
      return <LockClosedIcon className={className} aria-hidden />;
    case "growth":
      return <PlusIcon className={className} aria-hidden />;
    default:
      return <TokensIcon className={className} aria-hidden />;
  }
}

function StepCard({
  step,
  status,
  _pendingRecommendations,
  onOpen,
  onReset,
  onSkip,
  useRadixIcons = false,
}: {
  step: ConfiguratorStep;
  status: "complete" | "pending" | "skipped";
  _pendingRecommendations: string[];
  onOpen: () => void;
  onReset: () => void;
  onSkip: () => void;
  useRadixIcons?: boolean;
}): React.JSX.Element {
  const t = useTranslations();
  const trackMeta = step.track
    ? (getStepTrackMeta(t as unknown as (key: string, vars?: Record<string, unknown>) => string)?.[step.track])
    : undefined;
  const statusStyles = useStatusCopy()[status];
  const accentClass = trackMeta?.accentClass ?? "bg-primary";
  // removed unused var per lint: pendingRecommendations length computed at callsite when needed

  return (
    <CardRoot
      className={cn(
        // Clean hover/focus styling without duplicating base Card borders
        // i18n-exempt -- TECHDEBT-000 [ttl=2026-12-31]
        "relative overflow-hidden transition-colors hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20",
        status === "complete" && "border-success/50"
      )}
      data-tour={TOUR_TARGETS[step.id]}
    >
      <CardSection className="relative flex min-h-48 flex-col gap-5 pb-16">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          {/* Left cluster: icon + text on one row */}
          <div className="min-w-0 flex items-start gap-3">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded bg-info" aria-hidden>
              {useRadixIcons ? (
                <TrackIcon track={step.track} />
              ) : (
                <span className="text-xl">
                  {step.icon ?? "🧩"}
                  {/* i18n-exempt -- TECHDEBT-000 [ttl=2026-12-31] */}
                </span>
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-semibold tracking-tight text-foreground">
                  {step.label}
                </h4>
                {/* Optional chip removed */}
              </div>
              {/* Track pill moved to status column */}
            </div>
          </div>
          {/* Status */}
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Tag className="shrink-0" variant={statusStyles.variant} tone="soft">
              {statusStyles.label}
            </Tag>
            {trackMeta ? (
              <span
                className={cn(
                  // i18n-exempt -- TECHDEBT-000 [ttl=2026-12-31]
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  trackMeta.pillClass
                )}
              >
                {trackMeta.label}
              </span>
            ) : null}
            {status === "complete" && (
              <CheckCircledIcon className="h-5 w-5 text-success" aria-hidden />
            )}
          </div>
          {/* Description spanning both columns */}
          {step.description && (
            <p className="col-span-2 text-sm text-muted-foreground">{step.description}</p>
          )}
        </div>

        {/* Recommendation banner removed per request */}

        {/* Footer — absolutely pinned from card bottom, logical-safe inset */}
        <div className="pointer-events-auto absolute inset-x-6 bottom-2 flex flex-wrap items-center gap-2 justify-end">
          <ButtonElement
            asChild
            className="h-10 px-4 text-sm whitespace-nowrap"
            variant={status === "complete" ? "outline" : "default"}
          >
            <Link
              href={"/cms/configurator/" + step.id}
              onClick={onOpen}
              className="inline-flex items-center gap-2"
              aria-label={
                String(
                  status === "complete"
                    ? t("cms.configurator.step.aria.review", { label: step.label })
                    : t("cms.configurator.step.aria.continue", { label: step.label })
                )
              }
            >
              {status === "complete"
                ? t("cms.configurator.step.review")
                : t("cms.configurator.step.continue")}
              <ArrowRightIcon className="h-4 w-4" aria-hidden />
            </Link>
          </ButtonElement>
          {status === "complete" || status === "skipped" ? (
            <ButtonElement
              type="button"
              variant="ghost"
              className="h-10 px-3 text-sm"
              onClick={onReset}
            >
              <ResetIcon className="me-2 h-4 w-4" aria-hidden /> {t("actions.reset")}
            </ButtonElement>
          ) : step.optional ? (
            <ButtonElement
              type="button"
              variant="ghost"
              className="h-10 px-3 text-sm"
              onClick={onSkip}
            >
              {t("cms.configurator.step.skipForNow")}
            </ButtonElement>
          ) : null}
        </div>
      </CardSection>
      <span className={cn(
        // i18n-exempt -- TECHDEBT-000 [ttl=2026-12-31]
        "pointer-events-none absolute inset-x-0 bottom-0 h-1 rounded-full",
        accentClass
      )} />
    </CardRoot>
  );
}

export function ConfiguratorStepList({
  state,
  steps,
  skipStep,
  resetStep,
  onStepClick,
}: Props): React.JSX.Element {
  const t = useTranslations();
  const requiredSteps = steps.filter((step) => !step.optional);
  const optionalSteps = steps.filter((step) => step.optional);

  const requiredCompleted = requiredSteps.filter(
    (step) => state.completed?.[step.id] === "complete"
  ).length;
  const optionalCompleted = optionalSteps.filter(
    (step) => state.completed?.[step.id] === "complete"
  ).length;
  const requiredSummary = requiredSteps.length
    ? t("cms.configurator.sections.summary", {
        done: String(requiredCompleted),
        total: String(requiredSteps.length),
      })
    : t("cms.configurator.sections.summary.zero");
  const optionalSummary = optionalSteps.length
    ? t("cms.configurator.sections.summary", {
        done: String(optionalCompleted),
        total: String(optionalSteps.length),
      })
    : t("cms.configurator.sections.summary.zero");

  const renderSection = (
    sectionSteps: ConfiguratorStep[],
    options: { title: string; description: string; summary: string; useRadixIcons?: boolean }
  ) => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {options.title}
          </h3>
          <p className="text-sm text-muted-foreground/80">{options.description}</p>
        </div>
        <Tag className="shrink-0 bg-muted text-muted-foreground" variant="default">
          {options.summary}
        </Tag>
      </div>
      {/* Use DS Grid to satisfy layout rules on leaf nodes */}
      <Grid className="gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sectionSteps.map((step) => {
          const statusRaw = state.completed?.[step.id];
          const status = (statusRaw ?? "pending") as "complete" | "pending" | "skipped";
          const pendingRecommendations = (step.recommended ?? [])
            .map((id) => steps.find((s) => s.id === id))
            .filter(
              (recommendedStep): recommendedStep is ConfiguratorStep =>
                Boolean(recommendedStep)
            )
            .filter(
              (recommendedStep) => state.completed?.[recommendedStep.id] !== "complete"
            )
            .map((recommendedStep) => recommendedStep.label);

          return (
            <StepCard
              key={step.id}
              step={step}
              status={status}
              _pendingRecommendations={pendingRecommendations}
              onOpen={() => onStepClick(step)}
              onReset={() => resetStep(step.id)}
              onSkip={() => skipStep(step.id)}
              useRadixIcons={options.useRadixIcons}
            />
          );
        })}
      </Grid>
    </div>
  );

  return (
    <div className="space-y-10">
      {renderSection(requiredSteps, {
        title: String(t("cms.configurator.sections.required.title")),
        description: String(t("cms.configurator.sections.required.desc")),
        summary: requiredSummary,
        useRadixIcons: true,
      })}
      {optionalSteps.length > 0 &&
        renderSection(optionalSteps, {
          title: String(t("cms.configurator.sections.optional.title")),
          description: String(t("cms.configurator.sections.optional.desc")),
          summary: optionalSummary,
          useRadixIcons: true,
        })}
    </div>
  );
}

export default ConfiguratorStepList;
