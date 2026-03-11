import {
  IDEAS_LIVE_QUEUE_STATE_PATH,
  IDEAS_TRIAL_QUEUE_STATE_PATH,
} from "../../../../../scripts/src/startup-loop/ideas/lp-do-ideas-paths.js";

export const PROCESS_IMPROVEMENTS_QUEUE_MODE_ENV_VAR =
  "BUSINESS_OS_PROCESS_IMPROVEMENTS_QUEUE_MODE";

export const PROCESS_IMPROVEMENTS_TRIAL_QUEUE_STATE_PATH =
  IDEAS_TRIAL_QUEUE_STATE_PATH;

export const PROCESS_IMPROVEMENTS_LIVE_QUEUE_STATE_PATH =
  IDEAS_LIVE_QUEUE_STATE_PATH;

export type ProcessImprovementsQueueMode = "trial" | "live";

export interface ProcessImprovementsQueuePath {
  queueMode: ProcessImprovementsQueueMode;
  relativePath: string;
}

export function resolveProcessImprovementsQueueMode(
  env: NodeJS.ProcessEnv = process.env
): ProcessImprovementsQueueMode {
  const configuredMode = env[PROCESS_IMPROVEMENTS_QUEUE_MODE_ENV_VAR];

  if (!configuredMode || configuredMode === "trial") {
    return "trial";
  }

  if (configuredMode === "live") {
    return "live";
  }

  throw new Error(
    `Invalid ${PROCESS_IMPROVEMENTS_QUEUE_MODE_ENV_VAR}: ${configuredMode}`
  );
}

export function resolveProcessImprovementsQueuePath(
  env: NodeJS.ProcessEnv = process.env
): ProcessImprovementsQueuePath {
  const queueMode = resolveProcessImprovementsQueueMode(env);

  return {
    queueMode,
    relativePath:
      queueMode === "live"
        ? PROCESS_IMPROVEMENTS_LIVE_QUEUE_STATE_PATH
        : PROCESS_IMPROVEMENTS_TRIAL_QUEUE_STATE_PATH,
  };
}
