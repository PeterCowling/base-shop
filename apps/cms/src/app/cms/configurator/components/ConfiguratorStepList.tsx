// apps/cms/src/app/cms/configurator/components/ConfiguratorStepList.tsx
"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircledIcon,
  CircleIcon,
  ResetIcon,
} from "@radix-ui/react-icons";
import { Tag } from "@ui/components/atoms";
import type { ConfiguratorState } from "../../wizard/schema";
import type { ConfiguratorStep } from "../types";
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

function StepCard({
  step,
  status,
  pendingRecommendations,
  onOpen,
  onReset,
  onSkip,
}: {
  step: ConfiguratorStep;
  status: "complete" | "pending" | "skipped";
  pendingRecommendations: string[];
  onOpen: () => void;
  onReset: () => void;
  onSkip: () => void;
}): React.JSX.Element {
  const trackMeta = step.track ? stepTrackMeta?.[step.track] : undefined;
  const statusStyles = statusCopy[status];
  const accentClass = trackMeta?.accentClass ?? "bg-primary";
  const hasRecommendations = pendingRecommendations.length > 0;

  return (
    <CardRoot
      className={cn(
        "relative overflow-hidden border border-border/60 transition-all hover:border-primary/50",
        status === "complete" && "border-success/50"
      )}
    >
      <CardSection className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-1 text-2xl" aria-hidden>
              {step.icon ?? "🧩"}
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-semibold text-foreground">
                  {step.label}
                </h4>
                {step.optional && (
                  <Tag className="bg-muted text-muted-foreground" variant="default">
                    Optional
                  </Tag>
                )}
              </div>
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
              {step.description && (
                <p className="text-sm text-muted-foreground">{step.description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Tag variant={statusStyles.variant}>{statusStyles.label}</Tag>
            {status === "complete" ? (
              <CheckCircledIcon className="h-5 w-5 text-success" aria-hidden />
            ) : (
              <CircleIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
            )}
          </div>
        </div>

        {hasRecommendations && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning-fg">
            <p className="font-medium">Recommended before tackling this step</p>
            <ul className="list-disc pl-5">
              {pendingRecommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <ButtonElement
            asChild
            className="h-10 px-4 text-sm"
            variant={status === "complete" ? "outline" : "default"}
          >
            <Link
              href={"/cms/configurator/" + step.id}
              onClick={onOpen}
              aria-label={
                (status === "complete" ? "Review " : "Continue ") + step.label
              }
            >
              {status === "complete" ? "Review step" : "Continue step"}
              <ArrowRightIcon className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </ButtonElement>
          {status === "complete" || status === "skipped" ? (
            <ButtonElement
              type="button"
              variant="ghost"
              className="h-10 px-3 text-sm"
              onClick={onReset}
            >
              <ResetIcon className="mr-2 h-4 w-4" aria-hidden /> Reset
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
      <span className={cn("pointer-events-none absolute inset-x-4 bottom-0 h-1 rounded-full", accentClass)} />
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
    options: { title: string; description: string; summary: string }
  ) => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {options.title}
          </h3>
          <p className="text-sm text-muted-foreground/80">{options.description}</p>
        </div>
        <Tag className="bg-muted text-muted-foreground" variant="default">
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
      })}
      {optionalSteps.length > 0 &&
        renderSection(optionalSteps, {
          title: "Momentum boosters",
          description: "Optional enhancements that add polish and speed to your rollout.",
          summary: optionalSummary,
        })}
    </div>
  );
}

export default ConfiguratorStepList;
