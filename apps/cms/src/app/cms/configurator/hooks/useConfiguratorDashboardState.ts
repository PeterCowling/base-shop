"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { configuratorStateSchema, type ConfiguratorState } from "../../wizard/schema";
import type { ConfiguratorStep } from "../types";
import { useConfiguratorPersistence } from "./useConfiguratorPersistence";
import { useLaunchShop, type LaunchStepStatus } from "./useLaunchShop";
import { calculateConfiguratorProgress } from "../lib/progress";
import { useLayout } from "@platform-core/contexts/LayoutContext";
import { getSteps, stepTrackMeta, steps as configuratorSteps } from "../steps";

const stepLinks: Record<string, string> = {
  create: "summary",
  init: "import-data",
  deploy: "hosting",
  seed: "seed-data",
};

export interface QuickStat {
  label: string;
  value: string;
  caption: string;
}

export interface HeroResumeCta {
  href: string;
  label: string;
  isPrimary: boolean;
  onClick?: () => void;
}

export interface ConfiguratorHeroData {
  description: string;
  progressPercent: number;
  essentialProgressLabel: string;
  resumeCta: HeroResumeCta;
  quickStats: QuickStat[];
}

export interface TrackProgressItem {
  key: string;
  label: string;
  description: string;
  done: number;
  total: number;
  percent: number;
}

export interface LaunchErrorLink {
  href: string;
  label: string;
}

export interface LaunchPanelData {
  allRequiredDone: boolean;
  tooltipText: string;
  onLaunch: () => void;
  launchStatus: Record<string, LaunchStepStatus> | null;
  launchError: string | null;
  failedStepLink: LaunchErrorLink | null;
}

interface ToastState {
  open: boolean;
  message: string;
}

export function useConfiguratorDashboardState(): {
  state: ConfiguratorState;
  steps: ConfiguratorStep[];
  skipStep: (stepId: string) => void;
  resetStep: (stepId: string) => void;
  onStepClick: (step: ConfiguratorStep) => void;
  toast: ToastState;
  dismissToast: () => void;
  heroData: ConfiguratorHeroData;
  trackProgress: TrackProgressItem[];
  launchPanelData: LaunchPanelData;
} {
  const [state, setState] = useState<ConfiguratorState>(
    configuratorStateSchema.parse({})
  );
  const [toast, setToast] = useState<ToastState>({ open: false, message: "" });
  const { setConfiguratorProgress } = useLayout();

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const fetchState = useCallback(() => {
    fetch("/api/configurator-progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json) return;
        const incoming: ConfiguratorState = {
          ...stateRef.current,
          ...(json.state ?? json),
          completed: json.completed ?? {},
        } as ConfiguratorState;
        try {
          const prevHash = JSON.stringify(stateRef.current);
          const nextHash = JSON.stringify(incoming);
          if (prevHash === nextHash) return;
        } catch {}
        setState(incoming);
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
  const steps = useMemo(() => getSteps(), []);

  useEffect(() => {
    setConfiguratorProgress(calculateConfiguratorProgress(state.completed));
  }, [state.completed, setConfiguratorProgress]);

  useEffect(() => () => setConfiguratorProgress(undefined), [setConfiguratorProgress]);

  const skipStep = useCallback(
    (stepId: string) => {
      void markStepComplete(stepId, "skipped");
    },
    [markStepComplete]
  );

  const resetStep = useCallback(
    (stepId: string) => {
      void markStepComplete(stepId, "pending");
    },
    [markStepComplete]
  );

  const onStepClick = useCallback(
    (step: ConfiguratorStep) => {
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
    },
    [setToast, state?.completed]
  );

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
    () => steps.filter((step) => !step.optional),
    [steps]
  );
  const optionalSteps = useMemo(
    () => steps.filter((step) => step.optional),
    [steps]
  );

  const requiredCompleted = useMemo(
    () =>
      requiredSteps.filter((step) => state.completed?.[step.id] === "complete")
        .length,
    [requiredSteps, state.completed]
  );
  const optionalCompleted = useMemo(
    () =>
      optionalSteps.filter((step) => state.completed?.[step.id] === "complete")
        .length,
    [optionalSteps, state.completed]
  );
  const skippedOptional = useMemo(
    () =>
      optionalSteps.filter((step) => state.completed?.[step.id] === "skipped")
        .length,
    [optionalSteps, state.completed]
  );

  const progressPercent = requiredSteps.length
    ? Math.round((requiredCompleted / requiredSteps.length) * 100)
    : 0;

  const nextStep = useMemo(
    () => requiredSteps.find((step) => state.completed?.[step.id] !== "complete"),
    [requiredSteps, state.completed]
  );

  const heroDescription = useMemo(() => {
    const remainingRequired = requiredSteps.length - requiredCompleted;
    if (!nextStep) {
      return "Every foundational step is complete. Review the summary or explore optional enhancements before you launch.";
    }
    const suffix = remainingRequired === 1 ? "" : "s";
    return `You are only ${remainingRequired} step${suffix} away from launch. Pick up with ${nextStep.label} to keep momentum.`;
  }, [nextStep, requiredCompleted, requiredSteps.length]);

  const essentialProgressLabel = `${requiredCompleted}/${requiredSteps.length || 0} essential steps complete`;

  const resumeCta: HeroResumeCta = nextStep
    ? {
        href: `/cms/configurator/${nextStep.id}`,
        label: `Resume ${nextStep.label}`,
        isPrimary: true,
        onClick: () => onStepClick(nextStep),
      }
    : {
        href: "/cms/configurator/summary",
        label: "Review configuration",
        isPrimary: false,
      };

  const coreValue = `${requiredCompleted}/${requiredSteps.length || 0}`;
  const coreCaption =
    requiredCompleted === requiredSteps.length
      ? "All essential steps complete"
      : `${requiredSteps.length - requiredCompleted} remaining before launch`;

  const optionalValue = optionalSteps.length
    ? `${optionalCompleted}/${optionalSteps.length}`
    : "0";

  let optionalCaption = "";
  if (optionalSteps.length === 0) {
    optionalCaption = "No optional steps configured";
  } else if (skippedOptional > 0) {
    optionalCaption = `${optionalCompleted} done • ${skippedOptional} skipped`;
  } else {
    optionalCaption = `${optionalCompleted} completed so far`;
  }

  const quickStats: QuickStat[] = useMemo(
    () => [
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
    ],
    [allRequiredDone, coreCaption, coreValue, optionalCaption, optionalValue]
  );

  const trackProgress: TrackProgressItem[] = useMemo(() => {
    const meta = stepTrackMeta;
    if (!meta) {
      return [];
    }

    return Object.entries(meta)
      .map(([track, metaValue]) => {
        const scopedSteps = steps.filter((step) => step.track === track);
        if (scopedSteps.length === 0) return null;
        const done = scopedSteps.filter(
          (step) => state.completed?.[step.id] === "complete"
        ).length;
        const percent = Math.round((done / scopedSteps.length) * 100);
        return {
          key: track,
          label: metaValue.label,
          description: metaValue.description,
          done,
          total: scopedSteps.length,
          percent,
        };
      })
      .filter((value): value is TrackProgressItem => value !== null);
  }, [state.completed, steps]);

  const failedStepLink = useMemo<LaunchErrorLink | null>(() => {
    if (!failedStep) return null;
    const slug = stepLinks[failedStep];
    if (!slug) return null;
    const step = configuratorSteps[slug];
    if (!step) return null;
    return {
      href: `/cms/configurator/${slug}`,
      label: step.label,
    };
  }, [failedStep]);

  const heroData: ConfiguratorHeroData = {
    description: heroDescription,
    progressPercent,
    essentialProgressLabel,
    resumeCta,
    quickStats,
  };

  const launchPanelData: LaunchPanelData = {
    allRequiredDone,
    tooltipText,
    onLaunch: launchShop,
    launchStatus,
    launchError,
    failedStepLink,
  };

  const dismissToast = useCallback(() => {
    setToast({ open: false, message: "" });
  }, [setToast]);

  return {
    state,
    steps,
    skipStep,
    resetStep,
    onStepClick,
    toast,
    dismissToast,
    heroData,
    trackProgress,
    launchPanelData,
  };
}

export default useConfiguratorDashboardState;
