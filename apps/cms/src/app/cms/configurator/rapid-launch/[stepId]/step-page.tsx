"use client";

import { useEffect } from "react";

import { Tag } from "@acme/design-system/atoms";
import { cn } from "@acme/design-system/utils/style";
import { useTranslations } from "@acme/i18n";
import { track } from "@acme/telemetry";

import { Card, CardContent } from "@/components/atoms/shadcn";

import { useConfigurator } from "../../ConfiguratorContext";
import {
  getRapidLaunchSteps,
  getRapidLaunchStepsMap,
  RapidLaunchProgress,
  rapidLaunchStepIndex,
} from "../steps";

interface Props {
  stepId: string;
}

export default function StepPage({ stepId }: Props) {
  const { state } = useConfigurator();

  useEffect(() => {
    if (!state.shopId) return;
    track("build_flow_step_view", {
      shopId: state.shopId,
      stepId,
      surface: "rapid-launch",
    });
    if (typeof window !== "undefined") {
      const key = `cms-launch-start-${state.shopId}`;
      const trackedKey = `cms-launch-start-tracked-${state.shopId}`;
      if (!window.localStorage.getItem(key)) {
        const startedAt = Date.now();
        window.localStorage.setItem(key, String(startedAt));
        window.localStorage.setItem(trackedKey, "1");
        track("build_flow_timer_start", { shopId: state.shopId, startedAt });
      } else if (!window.localStorage.getItem(trackedKey)) {
        const existing = Number(window.localStorage.getItem(key));
        const startedAt = Number.isNaN(existing) ? Date.now() : existing;
        window.localStorage.setItem(trackedKey, "1");
        track("build_flow_timer_start", { shopId: state.shopId, startedAt });
      }
    }
  }, [state.shopId, stepId]);

  const t = useTranslations();
  const tFunc = t as unknown as (key: string, vars?: Record<string, unknown>) => string;
  const stepMap = getRapidLaunchStepsMap(tFunc);
  const step = stepMap[stepId];
  if (!step) return null;

  const list = getRapidLaunchSteps(tFunc);
  const idx = rapidLaunchStepIndex[stepId] ?? 0;
  const prev = list[idx - 1];
  const next = list[idx + 1];

  const StepComponent =
    step.component as unknown as React.ComponentType<{
      prevStepId?: string;
      nextStepId?: string;
    }>;

  const status = state.completed?.[step.id] ?? "pending";

  return (
    <div className="space-y-8">
      <Card className="border border-border-3 shadow-elevation-1">
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 text-3xl" aria-hidden>
                {step.icon ?? "✨"}
                {/* i18n-exempt -- CMS-1043 emoji icon [ttl=2026-12-31] */}
              </span>
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {t("cms.rapidLaunch.progress.stepOf", {
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
              </div>
            </div>
            <Tag
              variant={
                status === "complete"
                  ? "success"
                  : status === "skipped"
                    ? "warning"
                    : "default"
              }
              className={cn("self-start")}
            >
              {status === "complete"
                ? t("cms.configurator.step.status.complete")
                : status === "skipped"
                  ? t("cms.configurator.step.status.skipped")
                  : t("cms.configurator.step.status.inProgress")}
            </Tag>
          </div>
          <div className="rounded-xl border border-border-3 bg-muted/40 p-4">
            <RapidLaunchProgress
              currentStepId={stepId}
              completed={state.completed}
            />
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <StepComponent prevStepId={prev?.id} nextStepId={next?.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
