import type { ConfiguratorStep } from "../../types";
import type { ConfiguratorState } from "../../../wizard/schema";
import type { Environment } from "@acme/types";

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

export interface LaunchChecklistItem {
  id: string;
  label: string;
  status: "complete" | "error" | "pending";
  targetHref: string;
  statusLabel: string;
  fixLabel?: string;
  exitReason?: "settings" | "pages" | "products" | "tour";
}

export interface LaunchPanelData {
  allRequiredDone: boolean;
  serverReady: boolean;
  serverBlockingLabels: string[];
  beatTarget?: boolean;
  tooltipText: string;
  onLaunch: () => void;
  launchStatus: Record<string, import("../useLaunchShop").LaunchStepStatus> | null;
  launchError: string | null;
  failedStepLink: LaunchErrorLink | null;
  launchChecklist: LaunchChecklistItem[];
  shopId?: string;
  missingRequiredSteps?: ConfiguratorStep[];
  onMissingStepsResolved?: () => void;
  onRerunSmoke?: () => Promise<void>;
  rerunSmokeStatus?: "idle" | "pending" | "success" | "failure";
  rerunSmokeMessage?: string;
  launchEnvSummary?: {
    env: "dev" | "stage" | "prod";
    status: "ok" | "blocked" | "warning";
  }[];
  launchEnv: Environment;
  onChangeLaunchEnv: (env: Environment) => void;
  smokeSummary?: string;
  prodGateAllowed?: boolean;
  prodGateReasons?: string[];
  stageSmokeStatus?: "not-run" | "passed" | "failed";
  stageSmokeAt?: string;
  qaAckRequired?: boolean;
  qaAckCompleted?: boolean;
  onQaAcknowledge?: (note?: string) => Promise<void>;
  qaAckStatus?: "idle" | "pending" | "success" | "error";
  qaAckError?: string | null;
}

export interface StepGroupInfo {
  requiredSteps: ConfiguratorStep[];
  optionalSteps: ConfiguratorStep[];
  requiredCompleted: number;
  optionalCompleted: number;
  skippedOptional: number;
  progressPercent: number;
  nextStep: ConfiguratorStep | undefined;
}

export type CompletedState = ConfiguratorState["completed"] | undefined;

export interface TimeToLaunchData {
  startMs: number | null;
  elapsedMs: number;
  remainingMs: number;
  countdownMs: number;
  etaMs: number | null;
  targetMs: number;
  progressPercent: number;
  onTrack: boolean;
  ready: boolean;
}
