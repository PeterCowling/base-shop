"use client";

// Docs: docs/cms/build-shop-guide.md
// Docs: docs/cms/configurator-contract.md

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
  LaunchChecklistItem,
  LaunchErrorLink,
  LaunchPanelData,
  TrackProgressItem,
} from "./dashboard/types";
import { computeStepGroups } from "./dashboard/stepGroups";
import { buildHeroData } from "./dashboard/heroData";
import { buildTrackProgress } from "./dashboard/trackProgress";
import { getFailedStepLink } from "./dashboard/failedStepLink";
import type { ConfiguratorProgress as ServerConfiguratorProgress } from "@acme/types";
import { REQUIRED_CONFIG_CHECK_STEPS } from "@platform-core/configurator-steps";
import {
  deriveShopHealth,
  type ShopHealthSummary,
} from "../../../lib/shopHealth";
import type { Environment } from "@acme/types";
import type { DeployShopResult } from "@platform-core/createShop/deployTypes";
import { track } from "@acme/telemetry";
import {
  buildLaunchChecklist,
  calculateProgressFromServer,
  isLaunchReady,
} from "./dashboard/launchChecklist";
import { buildTimeToLaunch } from "./dashboard/timeToLaunch";
import { getCsrfToken } from "@acme/shared-utils";

type LaunchGateApi = {
  gate: {
    stageTestsStatus?: "not-run" | "passed" | "failed";
    stageTestsAt?: string;
    stageTestsVersion?: string;
    stageSmokeDisabled?: boolean;
    qaAck?: Record<string, unknown> | null;
    firstProdLaunchedAt?: string;
  };
  prodAllowed: boolean;
  missing: Array<"stage-tests" | "qa-ack">;
  stage: {
    status: "not-run" | "passed" | "failed";
    at?: string;
    error?: string | null;
    version?: string;
    smokeDisabled?: boolean;
  };
};

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
  quickLaunch: () => void;
  quickLaunchBusy: boolean;
  timeToLaunch: import("./dashboard/types").TimeToLaunchData;
  resetTimer: () => void;
} {
  const [state, setState] = useState<ConfiguratorState>(
    configuratorStateSchema.parse({})
  );
  const [toast, setToast] = useState<ToastState>({ open: false, message: "" });
  const [shopHealth, setShopHealth] = useState<ShopHealthSummary | null>(null);
  const [quickLaunchBusy, setQuickLaunchBusy] = useState(false);
  const [launchEnv, setLaunchEnv] = useState<Environment>("stage");
  const [deployInfo, setDeployInfo] = useState<DeployShopResult | null>(null);
  const [launchGate, setLaunchGate] = useState<LaunchGateApi | null>(null);
  const [qaAckStatus, setQaAckStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [qaAckError, setQaAckError] = useState<string | null>(null);
  const [launchChecklist, setLaunchChecklist] = useState<LaunchChecklistItem[]>([]);
  const [serverReady, setServerReady] = useState(false);
  const [serverBlockingLabels, setServerBlockingLabels] = useState<string[]>([]);
  const [startMs, setStartMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const timerDoneRef = useRef(false);
  const { setConfiguratorProgress } = useLayout();
  const [rerunSmokeStatus, setRerunSmokeStatus] = useState<"idle" | "pending" | "success" | "failure">("idle");
  const [rerunSmokeMessage, setRerunSmokeMessage] = useState<string | undefined>(undefined);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!state.shopId) return;
    const key = `cms-launch-start-${state.shopId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = Number(raw);
      if (!Number.isNaN(parsed)) {
        setStartMs(parsed);
        return;
      }
    }
    setStartMs(null);
    timerDoneRef.current = false;
  }, [state.shopId]);

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

  const fetchLaunchGate = useCallback(
    (shopId?: string) => {
      const id = shopId ?? stateRef.current.shopId;
      if (!id) return;
      fetch(`/api/launch-shop/gate?shopId=${encodeURIComponent(id)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json: LaunchGateApi | null) => {
          if (!json) return;
          setLaunchGate(json);
        })
        .catch(() => {
          /* ignore gate fetch errors */
        });
    },
    [],
  );

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  useEffect(() => {
    const handler = () => fetchState();
    window.addEventListener("configurator:update", handler);
    return () => window.removeEventListener("configurator:update", handler);
  }, [fetchState]);

  useEffect(() => {
    if (!state.shopId) return;
    fetchLaunchGate(state.shopId);
  }, [state.shopId, fetchLaunchGate]);

  const [markStepComplete] = useConfiguratorPersistence(state, setState);
  const t = useTranslations();
  const tFunc = t as unknown as (key: string, vars?: Record<string, unknown>) => string;
  const steps = useMemo(() => getSteps(tFunc), [tFunc]);
  const stepMap = useMemo(() => getStepsMap(tFunc), [tFunc]);

  // Avoid progress update loops by only updating when values actually change
  const lastProgressRef = useRef<ReturnType<typeof calculateConfiguratorProgress> | undefined>(undefined);
  const lastLaunchReadyRef = useRef(false);
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
        const next = calculateProgressFromServer(json);
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

        const nowLaunchReady = isLaunchReady(json);
        if (state.shopId && nowLaunchReady && !lastLaunchReadyRef.current) {
          track("build_flow_launch_ready", {
            shopId: state.shopId,
            checksPassing: [...REQUIRED_CONFIG_CHECK_STEPS],
          });
          lastLaunchReadyRef.current = true;
        }

        const checklist = buildLaunchChecklist({
          progress: json,
          translate: tFunc,
        });
        setLaunchChecklist(checklist);
        const requiredBlocking = checklist
          .filter((item) => REQUIRED_CONFIG_CHECK_STEPS.includes(item.id as (typeof REQUIRED_CONFIG_CHECK_STEPS)[number]))
          .filter((item) => item.status !== "complete")
          .map((item) => item.label);
        setServerReady(requiredBlocking.length === 0);
        setServerBlockingLabels(requiredBlocking);

        const health = deriveShopHealth(json);
        setShopHealth(health);
      })
      .catch(() => {
        // Ignore network errors; local progress remains as a fallback.
      });

    return () => {
      cancelled = true;
    };
  }, [state.completed, state.shopId, setConfiguratorProgress, tFunc]);

  useEffect(() => {
    if (!state.shopId) return;
    let cancelled = false;
    fetch(`/cms/api/configurator/deploy-shop?id=${encodeURIComponent(state.shopId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: DeployShopResult | null) => {
        if (!json || cancelled) return;
        setDeployInfo(json);
      })
      .catch(() => {
        // Ignore network errors; deploy info is best-effort for Launch panel.
      });
    return () => {
      cancelled = true;
    };
  }, [state.shopId]);

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
        billingProvider:
          state.billingProvider && state.billingProvider.length
            ? state.billingProvider
            : "stripe",
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
    missingSteps,
    clearMissingSteps,
  } = useLaunchShop(state, {
    env: launchEnv,
    onIncomplete: (missing) =>
      setToast({
        open: true,
        message: `Complete required steps: ${missing
          .map((s) => s.label)
          .join(", ")}`,
      }),
  });

  useEffect(() => {
    if (!state.shopId) return;
    if (launchStatus?.tests === "success" && launchEnv === "stage") {
      fetchLaunchGate(state.shopId);
    }
  }, [launchStatus?.tests, launchEnv, state.shopId, fetchLaunchGate]);

  const rerunSmoke = useCallback(async () => {
    if (!state.shopId) return;
    setRerunSmokeStatus("pending");
    setRerunSmokeMessage(undefined);
    try {
      const res = await fetch("/api/launch-shop/smoke", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken() ?? "",
        },
        body: JSON.stringify({ shopId: state.shopId, env: "stage" }),
      });
      const json = (await res.json().catch(() => ({}))) as { status?: string; error?: string };
      if (!res.ok || (json.status && json.status !== "passed" && json.status !== "not-run")) {
        setRerunSmokeStatus("failure");
        setRerunSmokeMessage(json.error ?? "Smoke tests failed");
        return;
      }
      setRerunSmokeStatus("success");
      setRerunSmokeMessage(
        json.status === "passed"
          ? "Smoke tests passed"
          : "Smoke tests not run",
      );
      // Refresh deploy info so smoke summary updates
      void fetch(`/cms/api/configurator/deploy-shop?id=${encodeURIComponent(state.shopId)}`).catch(() => {});
      fetchLaunchGate(state.shopId);
    } catch (err) {
      setRerunSmokeStatus("failure");
      setRerunSmokeMessage((err as Error).message);
    }
  }, [state.shopId, fetchLaunchGate]);

  const acknowledgeQa = useCallback(
    async (note?: string) => {
      if (!state.shopId) return;
      setQaAckStatus("pending");
      setQaAckError(null);
      try {
        const res = await fetch("/api/launch-shop/qa-ack", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": getCsrfToken() ?? "",
          },
          body: JSON.stringify({ shopId: state.shopId, note }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
        };
        if (!res.ok || json.ok !== true) {
          setQaAckStatus("error");
          setQaAckError(json.error ?? "Failed to record QA acknowledgement");
          return;
        }
        setQaAckStatus("success");
        fetchLaunchGate(state.shopId);
      } catch (err) {
        setQaAckStatus("error");
        setQaAckError((err as Error).message);
      }
    },
    [state.shopId, fetchLaunchGate],
  );

  const onChangeLaunchEnv = useCallback(
    (next: Environment) => {
      if (
        next === "prod" &&
        launchGate &&
        launchGate.prodAllowed === false
      ) {
        setToast({
          open: true,
          message: String(
            tFunc("cms.configurator.launchPanel.stageGate.toast") ??
              "Deploy to Stage, pass smoke, and confirm QA before launching Prod.",
          ),
        });
        return;
      }
      setLaunchEnv(next);
    },
    [launchGate, setToast, tFunc],
  );

  const groups = useMemo(
    () => computeStepGroups(steps, state.completed),
    [steps, state.completed]
  );

  const { heroData } = useMemo(
    () => buildHeroData(groups, allRequiredDone, onStepClick, shopHealth),
    [groups, allRequiredDone, onStepClick, shopHealth]
  );

  const launchReady = allRequiredDone && serverReady;
  const timeToLaunch = useMemo(
    () =>
      buildTimeToLaunch(
        steps,
        state.completed,
        startMs,
        nowMs,
        launchReady,
      ),
    [launchReady, nowMs, startMs, state.completed, steps],
  );

  const resetTimer = useCallback(() => {
    if (typeof window === "undefined" || !state.shopId) return;
    const now = Date.now();
    localStorage.setItem(`cms-launch-start-${state.shopId}`, String(now));
    localStorage.removeItem(`cms-launch-start-tracked-${state.shopId}`);
    localStorage.removeItem(`cms-launch-done-${state.shopId}`);
    timerDoneRef.current = false;
    setStartMs(now);
    track("build_flow_timer_start", { shopId: state.shopId, startedAt: now });
  }, [state.shopId]);

  useEffect(() => {
    if (!state.shopId || !startMs) return;
    const doneKey = `cms-launch-done-${state.shopId}`;
    const doneTracked = typeof window !== "undefined" ? localStorage.getItem(doneKey) : null;
    if (doneTracked === "1") {
      timerDoneRef.current = true;
      return;
    }
    if (launchReady && !timerDoneRef.current) {
      const durationMs = Date.now() - startMs;
      const beatTarget = timeToLaunch.countdownMs > 0;
      track("build_flow_timer_done", {
        shopId: state.shopId,
        durationMs,
        beatTarget,
      });
      timerDoneRef.current = true;
      if (typeof window !== "undefined") {
        localStorage.setItem(doneKey, "1");
      }
    }
  }, [launchReady, startMs, state.shopId, timeToLaunch.countdownMs]);

  const trackProgress: TrackProgressItem[] = useMemo(
    () => buildTrackProgress(steps, state.completed, tFunc),
    [steps, state.completed, tFunc]
  );

  const stageSmokeStatus = (launchGate?.stage?.status ??
    (deployInfo?.testsStatus as "not-run" | "passed" | "failed" | undefined) ??
    "not-run") as "not-run" | "passed" | "failed";
  const stageSmokeAt = launchGate?.stage?.at ?? deployInfo?.lastTestedAt;
  const prodGateAllowed = launchGate?.prodAllowed ?? true;
  const prodGateReasons =
    launchGate?.missing?.map((id) => id) ?? [];
  const hasStageVerification = Boolean(launchGate?.gate.stageTestsVersion);
  const qaAckCompleted = Boolean(launchGate?.gate?.qaAck);
  const qaAckRequired =
    hasStageVerification && (launchGate?.missing?.includes("qa-ack") ?? false);

  const failedStepLink = useMemo<LaunchErrorLink | null>(
    () => getFailedStepLink(failedStep),
    [failedStep]
  );
  const launchEnvSummary = useMemo<
    LaunchPanelData["launchEnvSummary"]
  >(() => {
    if (!shopHealth?.environments) return undefined;
    return shopHealth.environments.map((env) => ({
      env: env.env,
      status: env.status,
    })) as LaunchPanelData["launchEnvSummary"];
  }, [shopHealth]);
  const smokeSummary = useMemo(() => {
    if (!deployInfo && !launchGate) return undefined;
    const testedAt = stageSmokeAt;
    if (stageSmokeStatus === "passed") {
      return testedAt
        ? `Stage smoke tests passed @ ${new Date(testedAt).toLocaleString()}`
        : "Stage smoke tests passed";
    }
    if (stageSmokeStatus === "failed") {
      return testedAt
        ? `Stage smoke tests failed @ ${new Date(testedAt).toLocaleString()}`
        : "Stage smoke tests failed";
    }
    return "Stage smoke tests not run";
  }, [deployInfo, launchGate, stageSmokeAt, stageSmokeStatus]);
  // heroData and quickStats are derived above via buildHeroData
  const launchPanelData: LaunchPanelData = {
    allRequiredDone,
    serverReady,
    serverBlockingLabels,
    beatTarget: timeToLaunch.ready && timeToLaunch.countdownMs > 0,
    tooltipText,
    onLaunch: launchShop,
    launchStatus,
    launchError,
    failedStepLink,
    launchChecklist,
    missingRequiredSteps: missingSteps ?? undefined,
    onMissingStepsResolved: clearMissingSteps,
    onRerunSmoke: rerunSmoke,
    rerunSmokeStatus,
    rerunSmokeMessage,
    launchEnvSummary,
    launchEnv,
    onChangeLaunchEnv,
    smokeSummary,
    shopId: state.shopId,
    prodGateAllowed,
    prodGateReasons,
    stageSmokeStatus,
    stageSmokeAt,
    qaAckRequired,
    qaAckCompleted,
    onQaAcknowledge: qaAckRequired ? acknowledgeQa : undefined,
    qaAckStatus,
    qaAckError,
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
    timeToLaunch,
    resetTimer,
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
