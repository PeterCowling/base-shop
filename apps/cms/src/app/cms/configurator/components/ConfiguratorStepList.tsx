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
import { Tag } from "@ui/components/atoms";
import type { ConfiguratorState } from "../../wizard/schema";
import type { ConfiguratorStep, ConfiguratorStepTrack } from "../types";
import { stepTrackMeta } from "../steps";
import { cn } from "@ui/utils/style";
import { ButtonElement, CardRoot, CardSection } from "./DashboardPrimitives";

interface Props {
  state: ConfiguratorState;
  steps: ConfiguratorStep[];
  skipStep: (id: string) => void;
  resetStep: (id: string) => void;
  onStepClick: (step: ConfiguratorStep) => void;
}

type TagVariant = "default" | "success" | "warning" | "destructive";

const statusCopy: Record<string, { label: string; variant: TagVariant }> = {
  complete: { label: "Complete", variant: "success" },
  skipped: { label: "Skipped", variant: "warning" },
  pending: { label: "Pending", variant: "default" },
};

function TrackIcon({ track }: { track?: ConfiguratorStepTrack }) {
  const className = "h-[30px] w-[30px]";
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
  pendingRecommendations,
  onOpen,
  onReset,
  onSkip,
  useRadixIcons = false,
}: {
  step: ConfiguratorStep;
  status: "complete" | "pending" | "skipped";
  pendingRecommendations: string[];
  onOpen: () => void;
  onReset: () => void;
  onSkip: () => void;
  useRadixIcons?: boolean;
}): React.JSX.Element {
  const trackMeta = step.track ? stepTrackMeta?.[step.track] : undefined;
  const statusStyles = statusCopy[status];
  const accentClass = trackMeta?.accentClass ?? "bg-primary";
  const hasRecommendations = pendingRecommendations.length > 0;

  return (
    <CardRoot
      className={cn(
        // Clean hover/focus styling without duplicating base Card borders
        "relative overflow-hidden transition-colors hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20",
        status === "complete" && "border-success/50"
      )}
    >
      <CardSection className="flex min-h-48 flex-col gap-5 pb-16">
        {/* Header */}
        <div className="grid grid-cols-[1fr,auto] items-start gap-4">
          {/* Left cluster: icon + text on one row */}
          <div className="min-w-0 flex items-start gap-3">
            <div className="grid h-[30px] w-[30px] place-content-center rounded bg-info" aria-hidden>
              {useRadixIcons ? (
                <TrackIcon track={step.track} />
              ) : (
                <span className="inline-block h-[30px] w-[30px] leading-[30px] text-xl text-center">
                  {step.icon ?? "🧩"}
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

        {/* Footer — absolutely pinned 8px from card bottom */}
        <div className="pointer-events-auto absolute left-6 right-6 bottom-2 flex flex-wrap items-center gap-2 justify-end">
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
                (status === "complete" ? "Review " : "Continue ") + step.label
              }
            >
              {status === "complete" ? "Review step" : "Continue step"}
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
              <ResetIcon className="me-2 h-4 w-4" aria-hidden /> Reset
            </ButtonElement>
          ) : step.optional ? (
            <ButtonElement
              type="button"
              variant="ghost"
              className="h-10 px-3 text-sm"
              onClick={onSkip}
            >
              Skip for now
            </ButtonElement>
          ) : null}
        </div>
      </CardSection>
      <span className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-1 rounded-full", accentClass)} />
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
  const requiredSteps = steps.filter((step) => !step.optional);
  const optionalSteps = steps.filter((step) => step.optional);

  const requiredCompleted = requiredSteps.filter(
    (step) => state.completed?.[step.id] === "complete"
  ).length;
  const optionalCompleted = optionalSteps.filter(
    (step) => state.completed?.[step.id] === "complete"
  ).length;
  const requiredSummary = requiredSteps.length
    ? String(requiredCompleted) + "/" + String(requiredSteps.length) + " complete"
    : "0 complete";
  const optionalSummary = optionalSteps.length
    ? String(optionalCompleted) + "/" + String(optionalSteps.length) + " complete"
    : "0 complete";

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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
              pendingRecommendations={pendingRecommendations}
              onOpen={() => onStepClick(step)}
              onReset={() => resetStep(step.id)}
              onSkip={() => skipStep(step.id)}
              useRadixIcons={options.useRadixIcons}
            />
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      {renderSection(requiredSteps, {
        title: "Essential milestones",
        description: "Complete these steps to achieve launch readiness.",
        summary: requiredSummary,
        useRadixIcons: true,
      })}
      {optionalSteps.length > 0 &&
        renderSection(optionalSteps, {
          title: "Momentum boosters",
          description: "Optional enhancements that add polish and speed to your rollout.",
          summary: optionalSummary,
          useRadixIcons: true,
        })}
    </div>
  );
}

export default ConfiguratorStepList;
