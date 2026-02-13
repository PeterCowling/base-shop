/**
 * Run concurrency gate — one active run per business (LPSP-08).
 *
 * Enforces the DL-04 policy: only one active startup-loop run may exist
 * per business at a time. Relaxation requires threshold pass (future).
 *
 * @see docs/plans/lp-skill-system-sequencing-plan.md#LPSP-08
 * @see docs/business-os/startup-loop/autonomy-policy.md
 */

import { promises as fs } from "fs";
import path from "path";

// -- Types --

export interface ConcurrencyCheckResult {
  allowed: boolean;
  reason?: string;
  activeRunId?: string;
}

interface RunState {
  business: string;
  run_id: string;
  run_status: "active" | "complete" | "blocked";
  active_stage: string | null;
}

// -- Main --

export async function checkRunConcurrency(
  business: string,
  runsDir: string,
): Promise<ConcurrencyCheckResult> {
  let entries: string[];
  try {
    entries = await fs.readdir(runsDir);
  } catch {
    // No runs directory → no active runs → allowed
    return { allowed: true };
  }

  for (const entry of entries) {
    const statePath = path.join(runsDir, entry, "state.json");
    try {
      const data = JSON.parse(await fs.readFile(statePath, "utf-8")) as RunState;
      if (data.business === business && data.run_status === "active") {
        return {
          allowed: false,
          reason: `Blocked: one active run per business — ${data.run_id} is active at stage ${data.active_stage ?? "unknown"}`,
          activeRunId: data.run_id,
        };
      }
    } catch {
      // Skip entries without valid state.json
    }
  }

  return { allowed: true };
}
