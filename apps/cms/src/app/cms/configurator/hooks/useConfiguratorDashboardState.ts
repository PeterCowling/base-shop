"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  configuratorStateSchema,
  type ConfiguratorState,
} from "../../wizard/schema";
import type { ConfiguratorStep } from "../types";
import { useConfiguratorPersistence } from "./useConfiguratorPersistence";
import { useLaunchShop } from "./useLaunchShop";
import { calculateConfiguratorProgress } from "../lib/progress";
import { useLayout } from "@platform-core/contexts/LayoutContext";
import { getRequiredSteps, getSteps, getStepsMap } from "../steps";
import { useTranslations } from "@acme/i18n";
import type {
  ConfiguratorHeroData,
  LaunchErrorLink,
  LaunchPanelData,
  TrackProgressItem,
} from "./dashboard/types";
import { computeStepGroups } from "./dashboard/stepGroups";
import { buildHeroData } from "./dashboard/heroData";
import { buildTrackProgress } from "./dashboard/trackProgress";
import { getFailedStepLink } from "./dashboard/failedStepLink";
import type {
  ConfiguratorProgress as ServerConfiguratorProgress,
  ConfiguratorStepId,
} from "@acme/types";
import {
  deriveShopHealth,
  type ShopHealthSummary,
} from "../../../lib/shopHealth";

interface ToastState {
  open: boolean;
  message: string;
}

const REQUIRED_SERVER_STEPS: ConfiguratorStepId[] = [
  "shop-basics",
  "theme",
  "payments",
  "shipping-tax",
  "checkout",
  "products-inventory",
  "navigation-home",
];

const OPTIONAL_SERVER_STEPS: ConfiguratorStepId[] = [
  "domains",
  "reverse-logistics",
  "advanced-seo",
];

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
  quickLaunch: () => void;
  quickLaunchBusy: boolean;
} {
  const [state, setState] = useState<ConfiguratorState>(
    configuratorStateSchema.parse({})
  );
  const [toast, setToast] = useState<ToastState>({ open: false, message: "" });
  const [shopHealth, setShopHealth] = useState<ShopHealthSummary | null>(null);
  const [quickLaunchBusy, setQuickLaunchBusy] = useState(false);
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
    const local = calculateConfiguratorProgress(state.completed);
    const prevLocal = lastProgressRef.current;
    const localChanged =
      !prevLocal ||
      prevLocal.completedRequired !== local.completedRequired ||
      prevLocal.totalRequired !== local.totalRequired ||
      prevLocal.completedOptional !== local.completedOptional ||
      prevLocal.totalOptional !== local.totalOptional;
    if (localChanged) {
      lastProgressRef.current = local;
      setConfiguratorProgress(local);
    }

    if (!state.shopId) return;

    let cancelled = false;
    fetch(`/api/configurator-progress?shopId=${encodeURIComponent(state.shopId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: ServerConfiguratorProgress | null) => {
        if (!json || cancelled || !json.steps) return;
        const stepsById = json.steps as Record<ConfiguratorStepId, string>;
        const completedRequired = REQUIRED_SERVER_STEPS.filter(
          (id) => stepsById[id] === "complete",
        ).length;
        const completedOptional = OPTIONAL_SERVER_STEPS.filter(
          (id) => stepsById[id] === "complete",
        ).length;
        const next = {
          completedRequired,
          totalRequired: REQUIRED_SERVER_STEPS.length,
          completedOptional,
          totalOptional: OPTIONAL_SERVER_STEPS.length,
        };
        const prev = lastProgressRef.current;
        const changed =
          !prev ||
          prev.completedRequired !== next.completedRequired ||
          prev.totalRequired !== next.totalRequired ||
          prev.completedOptional !== next.completedOptional ||
          prev.totalOptional !== next.totalOptional;
        if (changed) {
          lastProgressRef.current = next;
          setConfiguratorProgress(next);
        }
        const health = deriveShopHealth(json);
        setShopHealth(health);
      })
      .catch(() => {
        // Ignore network errors; local progress remains as a fallback.
      });

    return () => {
      cancelled = true;
    };
  }, [state.completed, state.shopId, setConfiguratorProgress]);

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

  const quickLaunch = useCallback(() => {
    if (!state.shopId) {
      setToast({
        open: true,
        message:
          // i18n-exempt -- CMS-2134 helper text; surfaced in EN-only dashboard [ttl=2026-03-31]
          "Set a shop ID and basic details in the configurator before using quick launch.",
      });
      return;
    }
    if (quickLaunchBusy) return;
    setQuickLaunchBusy(true);
    try {
      const required = getRequiredSteps(tFunc);
      const completed: ConfiguratorState["completed"] = {
        ...(state.completed ?? {}),
      };
      for (const step of required) {
        completed[step.id] = "complete";
      }

      const nextState: ConfiguratorState = {
        ...state,
        // Prefer existing selections when present; otherwise apply safe defaults.
        payment:
          Array.isArray(state.payment) && state.payment.length
            ? state.payment
            : ["stripe"],
        shipping:
          Array.isArray(state.shipping) && state.shipping.length
            ? state.shipping
            : ["dhl"],
        categoriesText:
          state.categoriesText && state.categoriesText.trim().length
            ? state.categoriesText
            : "Accessories, Featured, SALE",
        completed,
      };

      setState(nextState);

      required.forEach((step) => {
        void markStepComplete(step.id, "complete");
      });

      setToast({
        open: true,
        message:
          // i18n-exempt -- CMS-2134 helper text; surfaced in EN-only dashboard [ttl=2026-03-31]
          "Quick-launch defaults applied. Review steps or run launch when you are ready.",
      });

      // Trigger a server-side refresh of configuration checks for this shop.
      void fetch(
        `/api/configurator-progress?shopId=${encodeURIComponent(state.shopId)}`,
      ).catch(() => {
        // Ignore network errors here; server-side progress will refresh on next change anyway.
      });
    } finally {
      setQuickLaunchBusy(false);
    }
  }, [state, tFunc, markStepComplete, quickLaunchBusy]);

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
    () => buildHeroData(groups, allRequiredDone, onStepClick, shopHealth),
    [groups, allRequiredDone, onStepClick, shopHealth]
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
    quickLaunch,
    quickLaunchBusy,
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
