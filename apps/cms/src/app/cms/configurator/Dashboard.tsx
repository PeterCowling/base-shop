"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { Button, Card, CardContent } from "@/components/atoms/shadcn";
import { Progress, Tag, Toast, Tooltip } from "@/components/atoms";
import type { TagProps } from "@ui/components/atoms/Tag";
import { configuratorStateSchema, type ConfiguratorState } from "../wizard/schema";
import { useConfiguratorPersistence } from "./hooks/useConfiguratorPersistence";
import { useLaunchShop, type LaunchStepStatus } from "./hooks/useLaunchShop";
import { calculateConfiguratorProgress } from "./lib/progress";
import { useLayout } from "@platform-core/contexts/LayoutContext";
import { getSteps, stepTrackMeta, steps as configuratorSteps } from "./steps";
import ConfiguratorStepList from "./components/ConfiguratorStepList";
import type { ConfiguratorStep } from "./types";
import { cn } from "@ui/utils/style";

const stepLinks: Record<string, string> = {
  create: "summary",
  init: "import-data",
  deploy: "hosting",
  seed: "seed-data",
};

export default function ConfiguratorDashboard() {
  const [state, setState] = useState<ConfiguratorState>(
    configuratorStateSchema.parse({})
  );
  const [toast, setToast] = useState<{ open: boolean; message: string }>(
    {
      open: false,
      message: "",
    }
  );
  const { setConfiguratorProgress } = useLayout();

  const fetchState = useCallback(() => {
    fetch("/cms/api/configurator-progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json) return;
        setState((prev: ConfiguratorState) => ({
          ...prev,
          ...(json.state ?? json),
          completed: json.completed ?? {},
        }));
      })
      .catch(() => setState(configuratorStateSchema.parse({})));
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    const handler = () => fetchState();
    window.addEventListener("configurator:update", handler);
    return () => window.removeEventListener("configurator:update", handler);
  }, [fetchState]);
  const [markStepComplete] = useConfiguratorPersistence(state, setState);
  const stepList = useMemo(() => getSteps(), []);

  useEffect(() => {
    setConfiguratorProgress(calculateConfiguratorProgress(state.completed));
  }, [state.completed, setConfiguratorProgress]);

  useEffect(() => () => setConfiguratorProgress(undefined), [setConfiguratorProgress]);

  const skipStep = (stepId: string) => markStepComplete(stepId, "skipped");
  const resetStep = (stepId: string) => markStepComplete(stepId, "pending");

  const handleStepClick = (step: ConfiguratorStep) => {
    const missing = (step.recommended ?? []).filter(
      (id) => !state?.completed?.[id]
    );
    if (missing.length > 0) {
      setToast({
        open: true,
        message: `Recommended to complete: ${missing
          .map((id) => configuratorSteps[id]?.label ?? id)
          .join(", ")}`,
      });
    }
  };

  const {
    launchShop,
    launchStatus,
    launchError,
    failedStep,
    allRequiredDone,
    tooltipText,
  } = useLaunchShop(state, {
    onIncomplete: (missing) =>
      setToast({
        open: true,
        message: `Complete required steps: ${missing
          .map((s) => s.label)
          .join(", ")}`,
      }),
  });

  const requiredSteps = useMemo(
    () => stepList.filter((step) => !step.optional),
    [stepList]
  );
  const optionalSteps = useMemo(
    () => stepList.filter((step) => step.optional),
    [stepList]
  );

  const requiredCompleted = requiredSteps.filter(
    (step) => state.completed?.[step.id] === "complete"
  ).length;
  const optionalCompleted = optionalSteps.filter(
    (step) => state.completed?.[step.id] === "complete"
  ).length;
  const skippedOptional = optionalSteps.filter(
    (step) => state.completed?.[step.id] === "skipped"
  ).length;

  const progressPercent = requiredSteps.length
    ? Math.round((requiredCompleted / requiredSteps.length) * 100)
    : 0;

  const nextStep = requiredSteps.find(
    (step) => state.completed?.[step.id] !== "complete"
  );

  const trackProgress = useMemo(() => {
    return Object.entries(stepTrackMeta)
      .map(([track, meta]) => {
        const scopedSteps = stepList.filter((step) => step.track === track);
        if (scopedSteps.length === 0) return null;
        const done = scopedSteps.filter(
          (step) => state.completed?.[step.id] === "complete"
        ).length;
        const percent = Math.round((done / scopedSteps.length) * 100);
        return {
          key: track,
          meta,
          done,
          total: scopedSteps.length,
          percent,
        };
      })
      .filter((value): value is NonNullable<typeof value> => value !== null);
  }, [state.completed, stepList]);

  const launchStatusMeta: Record<LaunchStepStatus, { label: string; variant: TagProps["variant"] }> = {
    idle: { label: "Idle", variant: "default" },
    pending: { label: "Running", variant: "warning" },
    success: { label: "Complete", variant: "success" },
    failure: { label: "Failed", variant: "destructive" },
  };

  const launchStepLabels: Record<string, string> = {
    create: "Create shop",
    init: "Initialise workspace",
    deploy: "Deploy infrastructure",
    seed: "Seed demo data",
  };

  const coreValue =
    String(requiredCompleted) +
    "/" +
    String(requiredSteps.length || 0);
  const coreCaption = requiredCompleted === requiredSteps.length
    ? "All essential steps complete"
    : String(requiredSteps.length - requiredCompleted) + " remaining before launch";

  const optionalValue = optionalSteps.length
    ? String(optionalCompleted) + "/" + String(optionalSteps.length)
    : "0";

  let optionalCaption = "";
  if (optionalSteps.length === 0) {
    optionalCaption = "No optional steps configured";
  } else if (skippedOptional > 0) {
    optionalCaption = String(optionalCompleted) +
      " done • " +
      String(skippedOptional) +
      " skipped";
  } else {
    optionalCaption = String(optionalCompleted) + " completed so far";
  }

  const quickStats = [
    {
      label: "Core milestones",
      value: coreValue,
      caption: coreCaption,
    },
    {
      label: "Optional upgrades",
      value: optionalValue,
      caption: optionalCaption,
    },
    {
      label: "Launch readiness",
      value: allRequiredDone ? "Ready" : "In progress",
      caption: allRequiredDone
        ? "You can launch whenever you're ready"
        : "Complete the remaining essentials to unlock launch",
    },
  ];

  const remainingRequired = requiredSteps.length - requiredCompleted;
  let heroDescription = "Every foundational step is complete. Review the summary or explore optional enhancements before you launch.";
  if (nextStep) {
    const stepLabel = nextStep.label;
    const suffix = remainingRequired === 1 ? "" : "s";
    heroDescription =
      "You are only " +
      String(remainingRequired) +
      " step" +
      suffix +
      " away from launch. Pick up with " +
      stepLabel +
      " to keep momentum.";
  }

  const essentialProgressLabel = coreValue + " essential steps complete";
  const resumeCtaCopy = nextStep
    ? "Resume " + nextStep.label
    : "Review configuration";
  const resumeHref = nextStep
    ? "/cms/configurator/" + nextStep.id
    : "/cms/configurator/summary";

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-slate-950 text-white shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,255,0.35),_transparent_55%)]" />
        <div className="relative grid gap-8 p-8 lg:grid-cols-[2fr,1fr] lg:gap-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
                Shop Configurator
              </span>
              <h1 className="text-3xl font-semibold md:text-4xl">
                Build a launch-ready storefront without the guesswork
              </h1>
              <p className="text-white/80">{heroDescription}</p>
            </div>
            <div className="space-y-4">
              <Progress
                value={progressPercent}
                label={essentialProgressLabel}
              />
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="h-11 px-5 text-sm font-semibold"
                  variant={nextStep ? "default" : "outline"}
                >
                  <Link
                    href={resumeHref}
                    onClick={nextStep ? () => handleStepClick(nextStep) : undefined}
                  >
                    {resumeCtaCopy}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 px-5 text-sm font-semibold border-white/40 text-white hover:bg-white/10"
                >
                  <Link href="/cms/configurator">Browse all steps</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {quickStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                    {stat.label}
                  </p>
                  <p className="text-xl font-semibold">{stat.value}</p>
                  <p className="text-xs text-white/70">{stat.caption}</p>
                </div>
              ))}
            </div>
          </div>
          <Card className="border border-white/20 bg-white/5 text-white shadow-2xl backdrop-blur">
            <CardContent className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Launch readiness</h2>
                <p className="text-sm text-white/70">
                  When every essential step is marked complete, you can launch directly from here.
                </p>
              </div>
              <Tooltip text={tooltipText}>
                <Button
                  onClick={launchShop}
                  disabled={!allRequiredDone}
                  className={cn(
                    "h-11 w-full px-5 text-sm font-semibold",
                    !allRequiredDone && "cursor-not-allowed opacity-60"
                  )}
                >
                  Launch shop
                </Button>
              </Tooltip>
              {!allRequiredDone && (
                <p className="text-xs text-white/70">
                  Complete the remaining essential steps to unlock launch.
                </p>
              )}
              {launchStatus ? (
                <div className="space-y-3">
                  {Object.entries(launchStatus).map(([key, status]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-3 py-2"
                    >
                      <span className="text-sm font-medium">
                        {launchStepLabels[key] ?? key}
                      </span>
                      <Tag variant={launchStatusMeta[status].variant}>
                        {launchStatusMeta[status].label}
                      </Tag>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/70">
                  Launch progress will appear here once you kick things off.
                </p>
              )}
              {launchError && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
                  <p>{launchError}</p>
                  {failedStep && stepLinks[failedStep] && (
                    <p className="mt-1">
                      <Link
                        href={"/cms/configurator/" + stepLinks[failedStep]}
                        className="underline"
                      >
                        Review {configuratorSteps[stepLinks[failedStep]].label}
                      </Link>{" "}
                      and retry the launch.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <ConfiguratorStepList
          state={state}
          steps={stepList}
          skipStep={skipStep}
          resetStep={resetStep}
          onStepClick={handleStepClick}
        />
        <div className="space-y-6">
          <Card className="border border-border/60">
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Experience arcs
                </h3>
                <p className="text-sm text-muted-foreground">
                  Keep an eye on each track of the configurator to ensure nothing is overlooked.
                </p>
              </div>
              <div className="space-y-4">
                {trackProgress.map((track) => (
                  <div key={track.key} className="space-y-2 rounded-xl border border-border/60 bg-muted/10 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">
                          {track.meta.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {track.meta.description}
                        </span>
                      </div>
                      <Tag className="bg-muted text-muted-foreground" variant="default">
                        {track.done}/{track.total}
                      </Tag>
                    </div>
                    <Progress value={track.percent} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {toast.open && (
        <Toast
          open={toast.open}
          message={toast.message}
          onClose={() => setToast({ open: false, message: "" })}
        />
      )}
    </div>
  );
}
