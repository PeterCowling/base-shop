export type MissionLoadout = {
  triageLeadCount: number;
  promotionLimit: number;
  marketSweepCandidateCount: number;
  stageM: {
    kind: "amazon_search" | "amazon_listing" | "taobao_listing";
    captureMode: "runner" | "queue";
    captureProfile: string;
    marketplace: string;
    maxResults: number;
  };
};

export type RunnerStatus = {
  runnerId?: string | null;
  lastSeen?: string | null;
  stale?: boolean | null;
  mode?: string | null;
  headless?: boolean | null;
  sessionProfile?: string | null;
  playbook?: string | null;
};

export type GameAchievement = {
  id: string;
  progress: number;
  target: number;
  unlocked: boolean;
};

export type GameEvent = {
  id: string;
  stage: string | null;
  status: string | null;
  createdAt: string | null;
  candidateId: string | null;
  leadTitle: string | null;
};

export type GameLootDrop = {
  id: string;
  kind: string | null;
  uri: string | null;
  createdAt: string | null;
  stage: string | null;
  candidateId: string | null;
  leadTitle: string | null;
};

export type GameState = {
  operator: {
    level: number;
    title: string;
    xp: number;
    nextLevelXp: number;
    progress: number;
    streakDays: number;
  };
  stats: {
    leadsNew: number;
    candidatesTotal: number;
    stageRunsToday: number;
    artifactsTotal: number;
    stageCounts: Record<string, number>;
  };
  achievements: GameAchievement[];
  events: GameEvent[];
  loot: GameLootDrop[];
};

export type MissionActionResult = {
  ok: boolean;
  mission?: string;
  summary?: string;
  details?: unknown;
};

// Type aliases for backward compatibility with orphaned root-level panel files
export type MissionId = "triage-blitz" | "promotion-sortie" | "market-sweep";

export type AchievementId =
  | "runner_online"
  | "first_triage"
  | "first_promotion"
  | "first_sweep"
  | "first_artifact"
  | "streak_3"
  | "streak_7"
  | "vault_10";

export type MissionState = {
  id: MissionId;
  status: "ready" | "running" | "complete" | "locked";
  progress?: number;
  target?: number;
};

export type GameStateResponse = {
  operator: GameState["operator"];
  stats: GameState["stats"];
  achievements: (GameAchievement & { id: AchievementId })[];
  events: GameEvent[];
  loot: GameLootDrop[];
  runner: RunnerStatus | null;
  missions: MissionState[];
  counts: Record<string, number>;
};

export type MissionControlStrings = {
  hud: {
    label: string;
    title: string;
    levelLabel: string;
    streakLabel: string;
    streakDays: string;
    stageRunsTodayLabel: string;
    leadsNewLabel: string;
    candidatesLabel: string;
    artifactsLabel: string;
    xpLabel: string;
    nextLevel: string;
    nextLevelLabel: string;
  };
  missions: {
    label: string;
    title: string;
    busyLabel: string;
    triageBlitz: { title: string; description: string; cta: string };
    promotionSortie: { title: string; description: string; cta: string };
    marketSweep: { title: string; description: string; cta: string };
  };
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
  achievements: {
    label: string;
    title: string;
    [key: string]: string | { title: string; description: string };
  };
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
    lastSeen: string;
    lastSeenLabel: string;
    modeLabel: string;
    browserLabel: string;
    sessionLabel: string;
  };
  notAvailable: string;
};

export type MissionActionPayloads = {
  "triage-blitz": { leadCount: number };
  "promotion-sortie": { limit: number };
  "market-sweep": { candidateCount: number; stageM: MissionLoadout["stageM"] };
};
