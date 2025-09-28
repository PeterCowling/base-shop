"use client";

import { ConfiguratorProgress, getSteps, getStepsMap, stepIndex, getStepTrackMeta } from "../steps";
import { useConfigurator } from "../ConfiguratorContext";
import { Card, CardContent } from "@/components/atoms/shadcn";
import { Alert, Tag } from "@ui/components/atoms";
import { cn } from "@ui/utils/style";
import type { ConfiguratorStep } from "../types";
import { useTranslations } from "@acme/i18n";

interface Props {
  stepId: string;
}

export default function StepPage({ stepId }: Props) {
  const t = useTranslations();
  const stepMap = getStepsMap(t);
  const step = stepMap[stepId];
  const { state } = useConfigurator();
  if (!step) {
    return null;
  }

  const list = getSteps(t);
  const idx = stepIndex[stepId] ?? 0;
  const prev = list[idx - 1];
  const next = list[idx + 1];

  const StepComponent =
    step.component as unknown as React.ComponentType<Record<string, unknown>>;

  const pendingRecommendations = (step.recommended ?? [])
    .map((id) => stepMap[id])
    .filter((recommendedStep): recommendedStep is ConfiguratorStep =>
      Boolean(recommendedStep) && state.completed?.[recommendedStep.id] !== "complete"
    );

  const status = state.completed?.[step.id] ?? "pending";
  const trackMeta = step.track ? getStepTrackMeta(t)[step.track] : undefined;

  return (
    <div className="space-y-8">
      <Card className="border border-border-3 shadow-elevation-1">
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 text-3xl" aria-hidden>
                {step.icon ?? "🧩"}
                {/* i18n-exempt -- TECHDEBT-000 [ttl=2026-12-31] */}
              </span>
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {t("cms.configurator.step.progress", {
                      current: String(idx + 1),
                      total: String(list.length),
                    })}
                  </span>
                  <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
                    {step.label}
                  </h1>
                </div>
                {step.description && (
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                )}
                {trackMeta && (
                  <span
                    className={cn(
                      // i18n-exempt -- TECHDEBT-000 [ttl=2026-12-31]
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
                ? t("cms.configurator.step.status.complete")
                : status === "skipped"
                  ? t("cms.configurator.step.status.skipped")
                  : t("cms.configurator.step.status.inProgress")}
            </Tag>
          </div>
          <div className="rounded-xl border border-border-3 bg-muted/40 p-4">
            <ConfiguratorProgress currentStepId={stepId} completed={state.completed} />
          </div>
          {pendingRecommendations.length > 0 && (
            <Alert
              variant="warning"
              tone="soft"
              heading={t("cms.configurator.step.recommendedFirst")}
            >
              <ul className="mt-1 list-disc pl-5">
                {pendingRecommendations.map((recommendedStep) => (
                  <li key={recommendedStep.id}>{recommendedStep.label}</li>
                ))}
              </ul>
            </Alert>
          )}
          <div className="rounded-2xl border border-border bg-card p-6">
            <StepComponent prevStepId={prev?.id} nextStepId={next?.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
