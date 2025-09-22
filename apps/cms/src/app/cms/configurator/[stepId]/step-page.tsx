"use client";

import { ConfiguratorProgress, getSteps, stepIndex, stepTrackMeta, steps } from "../steps";
import { useConfigurator } from "../ConfiguratorContext";
import { Card, CardContent } from "@/components/atoms/shadcn";
import { Tag } from "@ui/components/atoms";
import { cn } from "@ui/utils/style";
import type { ConfiguratorStep } from "../types";

interface Props {
  stepId: string;
}

export default function StepPage({ stepId }: Props) {
  const step = steps[stepId];
  const { state } = useConfigurator();
  if (!step) {
    return null;
  }

  const list = getSteps();
  const idx = stepIndex[stepId] ?? 0;
  const prev = list[idx - 1];
  const next = list[idx + 1];

  const StepComponent =
    step.component as unknown as React.ComponentType<Record<string, unknown>>;

  const pendingRecommendations = (step.recommended ?? [])
    .map((id) => steps[id])
    .filter((recommendedStep): recommendedStep is ConfiguratorStep =>
      Boolean(recommendedStep) && state.completed?.[recommendedStep.id] !== "complete"
    );

  const status = state.completed?.[step.id] ?? "pending";
  const trackMeta = step.track ? stepTrackMeta[step.track] : undefined;

  return (
    <div className="space-y-8">
      <Card className="border border-border-3 shadow-elevation-1">
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 text-3xl" aria-hidden>
                {step.icon ?? "🧩"}
              </span>
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Step {idx + 1} of {list.length}
                  </span>
                  <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
                    {step.label}
                  </h1>
                </div>
                {step.description && (
                  <p className="max-w-3xl text-sm text-muted-foreground">
                    {step.description}
                  </p>
                )}
                {trackMeta && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                      trackMeta.pillClass
                    )}
                  >
                    {trackMeta.label}
                  </span>
                )}
              </div>
            </div>
            <Tag
              variant={status === "complete" ? "success" : status === "skipped" ? "warning" : "default"}
              className="self-start"
            >
              {status === "complete"
                ? "Complete"
                : status === "skipped"
                  ? "Skipped"
                  : "In progress"}
            </Tag>
          </div>
          <div className="rounded-xl border border-border-3 bg-muted/40 p-4">
            <ConfiguratorProgress currentStepId={stepId} completed={state.completed} />
          </div>
          {pendingRecommendations.length > 0 && (
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning-fg">
              <p className="font-medium">Recommended to finish first</p>
              <ul className="mt-1 list-disc pl-5">
                {pendingRecommendations.map((recommendedStep) => (
                  <li key={recommendedStep.id}>{recommendedStep.label}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="rounded-2xl border border-border bg-card p-6">
            <StepComponent prevStepId={prev?.id} nextStepId={next?.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
