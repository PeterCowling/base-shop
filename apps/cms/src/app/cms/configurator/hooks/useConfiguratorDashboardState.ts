"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { configuratorStateSchema, type ConfiguratorState } from "../../wizard/schema";
import type { ConfiguratorStep } from "../types";
import { useConfiguratorPersistence } from "./useConfiguratorPersistence";
import { useLaunchShop } from "./useLaunchShop";
import { calculateConfiguratorProgress } from "../lib/progress";
import { useLayout } from "@platform-core/contexts/LayoutContext";
import { getSteps, getStepsMap } from "../steps";
import { useTranslations } from "@acme/i18n";
import type { ConfiguratorHeroData, LaunchErrorLink, LaunchPanelData, TrackProgressItem } from "./dashboard/types";
import { computeStepGroups } from "./dashboard/stepGroups";
import { buildHeroData } from "./dashboard/heroData";
import { buildTrackProgress } from "./dashboard/trackProgress";
import { getFailedStepLink } from "./dashboard/failedStepLink";

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
  const t = useTranslations();
  const tFunc = t as unknown as (key: string, vars?: Record<string, unknown>) => string;
  const steps = useMemo(() => getSteps(tFunc), [tFunc]);
  const stepMap = useMemo(() => getStepsMap(tFunc), [tFunc]);

  // Avoid progress update loops by only updating when values actually change
  const lastProgressRef = useRef<ReturnType<typeof calculateConfiguratorProgress> | undefined>(undefined);
  useEffect(() => {
    const next = calculateConfiguratorProgress(state.completed);
    const prev = lastProgressRef.current;
    const changed = !prev ||
      prev.completedRequired !== next.completedRequired ||
      prev.totalRequired !== next.totalRequired ||
      prev.completedOptional !== next.completedOptional ||
      prev.totalOptional !== next.totalOptional;
    if (changed) {
      lastProgressRef.current = next;
      setConfiguratorProgress(next);
    }
  }, [state.completed, setConfiguratorProgress]);

  useEffect(() => {
    return () => {
      if (lastProgressRef.current) {
        lastProgressRef.current = undefined;
        setConfiguratorProgress(undefined);
      }
    };
  }, [setConfiguratorProgress]);

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
            .map((id) => stepMap[id]?.label ?? id)
            .join(", ")}`,
        });
      }
    },
    [setToast, state?.completed, stepMap]
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

  const groups = useMemo(
    () => computeStepGroups(steps, state.completed),
    [steps, state.completed]
  );

  const { heroData } = useMemo(
    () => buildHeroData(groups, allRequiredDone, onStepClick),
    [groups, allRequiredDone, onStepClick]
  );

  const trackProgress: TrackProgressItem[] = useMemo(
    () => buildTrackProgress(steps, state.completed, tFunc),
    [steps, state.completed, tFunc]
  );

  const failedStepLink = useMemo<LaunchErrorLink | null>(
    () => getFailedStepLink(failedStep),
    [failedStep]
  );
  // heroData and quickStats are derived above via buildHeroData
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

export type {
  QuickStat,
  HeroResumeCta,
  ConfiguratorHeroData,
  TrackProgressItem,
  LaunchPanelData,
  LaunchErrorLink,
} from "./dashboard/types";
