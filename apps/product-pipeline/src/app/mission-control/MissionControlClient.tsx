"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Grid, Stack } from "@acme/design-system/primitives";

import AchievementsPanel from "./panels/AchievementsPanel";
import BattleLogPanel from "./panels/BattleLogPanel";
import HudPanel from "./panels/HudPanel";
import LoadoutPanel from "./panels/LoadoutPanel";
import LootDropsPanel from "./panels/LootDropsPanel";
import MissionsPanel from "./panels/MissionsPanel";
import PipelineMapPanel from "./panels/PipelineMapPanel";
import RunnerPanel from "./panels/RunnerPanel";
import type { GameState, MissionActionResult, MissionLoadout, RunnerStatus } from "./types";

const LOADOUT_STORAGE_KEY = "pp_mission_loadout_v1";

function parseNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function loadStoredLoadout(): MissionLoadout | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LOADOUT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<MissionLoadout>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      triageLeadCount: parseNumber(parsed.triageLeadCount, 40),
      promotionLimit: parseNumber(parsed.promotionLimit, 5),
      marketSweepCandidateCount: parseNumber(parsed.marketSweepCandidateCount, 8),
      stageM: {
        kind: parsed.stageM?.kind ?? "amazon_search",
        captureMode: parsed.stageM?.captureMode ?? "runner",
        captureProfile: parsed.stageM?.captureProfile ?? "local",
        marketplace: parsed.stageM?.marketplace ?? "de",
        maxResults: parseNumber(parsed.stageM?.maxResults, 20),
      },
    };
  } catch {
    return null;
  }
}

function defaultLoadout(): MissionLoadout {
  return {
    triageLeadCount: 40,
    promotionLimit: 5,
    marketSweepCandidateCount: 8,
    stageM: {
      kind: "amazon_search",
      captureMode: "runner",
      captureProfile: "local",
      marketplace: "de",
      maxResults: 20,
    },
  };
}

function safeJson<T>(value: unknown): T | null {
  if (!value) return null;
  if (typeof value !== "object") return null;
  return value as T;
}

export default function MissionControlClient({
  strings,
}: {
  strings: {
    hud: {
      label: string;
      title: string;
      levelLabel: string;
      streakLabel: string;
      stageRunsTodayLabel: string;
      leadsNewLabel: string;
      candidatesLabel: string;
      artifactsLabel: string;
      xpLabel: string;
      nextLevelLabel: string;
    };
    missions: Record<string, unknown>;
    loadout: {
      label: string;
      title: string;
      triageLeadCountLabel: string;
      promotionLimitLabel: string;
      marketSweepCountLabel: string;
      stageMKindLabel: string;
      stageMCaptureModeLabel: string;
      stageMCaptureProfileLabel: string;
      stageMMarketplaceLabel: string;
      stageMMaxResultsLabel: string;
      stageMKindAmazonSearch: string;
      stageMKindAmazonListing: string;
      stageMKindTaobaoListing: string;
      stageMCaptureModeRunner: string;
      stageMCaptureModeQueue: string;
      stageMCaptureProfileHelp: string;
    };
    map: {
      label: string;
      title: string;
      hint: string;
      mode2d: string;
      mode3d: string;
    };
    achievements: Record<string, unknown>;
    battleLog: {
      label: string;
      title: string;
      empty: string;
    };
    loot: {
      label: string;
      title: string;
      empty: string;
      openArtifact: string;
    };
    runner: {
      label: string;
      title: string;
      statusLabel: string;
      statusReady: string;
      statusStale: string;
      statusUnknown: string;
      lastSeenLabel: string;
      modeLabel: string;
      browserLabel: string;
      sessionLabel: string;
    };
    notAvailable: string;
  };
}) {
  const [loadout, setLoadout] = useState<MissionLoadout>(() => defaultLoadout());
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameStateLoading, setGameStateLoading] = useState(false);
  const [runnerStatus, setRunnerStatus] = useState<RunnerStatus | null>(null);
  const [runnerStatusLoading, setRunnerStatusLoading] = useState(false);
  const [missionBusy, setMissionBusy] = useState(false);
  const [missionResult, setMissionResult] = useState<MissionActionResult | null>(
    null,
  );
  const lastLevelRef = useRef<number | null>(null);
  const [levelUpToast, setLevelUpToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const stored = loadStoredLoadout();
    if (stored) setLoadout(stored);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LOADOUT_STORAGE_KEY, JSON.stringify(loadout));
  }, [loadout]);

  const loadGameState = useCallback(async () => {
    setGameStateLoading(true);
    try {
      const response = await fetch("/api/game/state", { cache: "no-store" });
      if (!response.ok) {
        setGameState(null);
        return;
      }
      const payload = (await response.json().catch(() => null)) as unknown;
      const state = safeJson<{ state?: GameState }>(payload)?.state ?? null;
      setGameState(state);
    } catch (error) {
      console.error(error);
      setGameState(null);
    } finally {
      setGameStateLoading(false);
    }
  }, []);

  const loadRunnerStatus = useCallback(async () => {
    setRunnerStatusLoading(true);
    try {
      const response = await fetch("/api/runner/status", { cache: "no-store" });
      if (!response.ok) {
        setRunnerStatus(null);
        return;
      }
      const payload = (await response.json().catch(() => null)) as unknown;
      const status = safeJson<{ runner?: RunnerStatus | null }>(payload)?.runner;
      setRunnerStatus(status ?? null);
    } catch (error) {
      console.error(error);
      setRunnerStatus(null);
    } finally {
      setRunnerStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGameState();
    const interval = window.setInterval(loadGameState, 15000);
    return () => window.clearInterval(interval);
  }, [loadGameState]);

  useEffect(() => {
    loadRunnerStatus();
    const interval = window.setInterval(loadRunnerStatus, 15000);
    return () => window.clearInterval(interval);
  }, [loadRunnerStatus]);

  useEffect(() => {
    if (!gameState) return;
    const nextLevel = gameState.operator.level;
    const previous = lastLevelRef.current;
    lastLevelRef.current = nextLevel;
    if (previous !== null && nextLevel > previous) {
      setLevelUpToast(`Level up: ${gameState.operator.title} (L${nextLevel})`);
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = window.setTimeout(() => {
        setLevelUpToast(null);
      }, 3500);
    }
  }, [gameState]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const runMission = useCallback(
    async (mission: "triage-blitz" | "promotion-sortie" | "market-sweep") => {
      setMissionBusy(true);
      setMissionResult(null);
      try {
        const body =
          mission === "triage-blitz"
            ? {
                leadCount: loadout.triageLeadCount,
              }
            : mission === "promotion-sortie"
              ? {
                  leadCount: loadout.triageLeadCount,
                  promotionLimit: loadout.promotionLimit,
                }
              : {
                  candidateCount: loadout.marketSweepCandidateCount,
                  ...loadout.stageM,
                };

        const response = await fetch(`/api/game/actions/${mission}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const payload = (await response.json().catch(() => null)) as unknown;
        const result =
          safeJson<MissionActionResult>(payload) ??
          ({ ok: false, summary: strings.notAvailable } satisfies MissionActionResult);
        setMissionResult(result);
      } catch (error) {
        console.error(error);
        setMissionResult({
          ok: false,
          mission,
          // i18n-exempt -- PP-001 [ttl=2027-01-01] internal admin tool fallback
          summary: "Mission failed",
        });
      } finally {
        setMissionBusy(false);
        await loadGameState();
      }
    },
    [loadGameState, loadout, strings.notAvailable],
  );

  const stageCounts = useMemo(() => gameState?.stats.stageCounts ?? {}, [gameState]);

  return (
    <Stack gap={6}>
      {levelUpToast && (
        <div className="pp-levelup" role="status" aria-live="polite">
          {levelUpToast}
        </div>
      )}

      <Grid cols={1} gap={6} className="lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HudPanel
            strings={strings.hud}
            state={gameState}
            loading={gameStateLoading}
          />
        </div>
        <RunnerPanel
          strings={strings.runner}
          runner={runnerStatus}
          loading={runnerStatusLoading}
          notAvailable={strings.notAvailable}
        />
      </Grid>

      <Grid cols={1} gap={6} className="xl:grid-cols-3">
        <div className="xl:col-span-2">
          <MissionsPanel
            strings={strings.missions}
            loadout={loadout}
            busy={missionBusy}
            result={missionResult}
            onRunMission={runMission}
          />
        </div>
        <LoadoutPanel strings={strings.loadout} loadout={loadout} onChange={setLoadout} />
      </Grid>

      <Grid cols={1} gap={6} className="xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PipelineMapPanel strings={strings.map} stageCounts={stageCounts} />
        </div>
        <AchievementsPanel
          strings={strings.achievements}
          achievements={gameState?.achievements ?? []}
        />
      </Grid>

      <Grid cols={1} gap={6} className="xl:grid-cols-2">
        <BattleLogPanel strings={strings.battleLog} events={gameState?.events ?? []} />
        <LootDropsPanel strings={strings.loot} loot={gameState?.loot ?? []} />
      </Grid>
    </Stack>
  );
}
