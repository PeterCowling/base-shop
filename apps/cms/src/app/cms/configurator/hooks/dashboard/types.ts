import type { ConfiguratorStep } from "../../types";
import type { ConfiguratorState } from "../../../wizard/schema";

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
  launchStatus: Record<string, import("../useLaunchShop").LaunchStepStatus> | null;
  launchError: string | null;
  failedStepLink: LaunchErrorLink | null;
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
