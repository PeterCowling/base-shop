// TASK-05: draft_ranker_calibrate — compute and persist ranker priors from signal events.
//
// Reads draft-signal-events.jsonl, aggregates rewrite_reason deltas per
// (scenario_category, template_subject), clamps to ±30, and writes
// ranker-template-priors.json with a calibrated_at timestamp.
// Minimum gate: ≥20 joined events since last calibration.

import { readFile, rename, writeFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";

import {
  archiveEvents,
  countSignalEvents,
  joinEvents,
  readSignalEvents,
  type RefinementEvent,
  type SelectionEvent,
} from "../utils/signal-events.js";
import { errorResult, formatError, jsonResult } from "../utils/validation.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SIGNAL_EVENTS_PATH = join(
  process.cwd(),
  "packages",
  "mcp-server",
  "data",
  "draft-signal-events.jsonl",
);

const RANKER_PRIORS_PATH = join(
  process.cwd(),
  "packages",
  "mcp-server",
  "data",
  "ranker-template-priors.json",
);

const MIN_EVENTS_GATE = 20;
const PRIOR_CAP = 30;

// ---------------------------------------------------------------------------
// Delta mapping for rewrite_reason values
// ---------------------------------------------------------------------------

const REWRITE_REASON_DELTAS: Record<string, number> = {
  none: +4,
  style: +4,
  "language-adapt": +4,
  "light-edit": 0,
  "heavy-rewrite": -8,
  "missing-info": -8,
  "wrong-template": -16,
};

// ---------------------------------------------------------------------------
// Hard-rule protected categories — excluded from calibration
// ---------------------------------------------------------------------------

const PROTECTED_CATEGORIES = new Set(["prepayment", "cancellation"]);

// ---------------------------------------------------------------------------
// Calibration logic
// ---------------------------------------------------------------------------

function computePriors(
  pairs: Array<{ selection: SelectionEvent; refinement: RefinementEvent }>,
): Record<string, Record<string, number>> {
  // Map: category -> template_subject -> list of deltas
  const accumulator = new Map<string, Map<string, number[]>>();

  for (const { selection, refinement } of pairs) {
    const category = selection.scenario_category;
    if (PROTECTED_CATEGORIES.has(category)) continue;

    const templateSubject = selection.template_subject;
    if (!templateSubject) continue;

    const delta = REWRITE_REASON_DELTAS[refinement.rewrite_reason] ?? 0;

    if (!accumulator.has(category)) {
      accumulator.set(category, new Map());
    }
    const categoryMap = accumulator.get(category)!;
    if (!categoryMap.has(templateSubject)) {
      categoryMap.set(templateSubject, []);
    }
    categoryMap.get(templateSubject)!.push(delta);
  }

  // Compute mean per (category, template_subject), clamp to ±30, round to integer.
  const priors: Record<string, Record<string, number>> = {};

  for (const [category, categoryMap] of accumulator) {
    priors[category] = {};
    for (const [subject, deltas] of categoryMap) {
      const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
      const clamped = Math.max(-PRIOR_CAP, Math.min(PRIOR_CAP, mean));
      priors[category][subject] = Math.round(clamped);
    }
  }

  return priors;
}


async function writePriorsAtomic(
  priors: Record<string, Record<string, number>>,
  calibratedAt: string,
): Promise<void> {
  const payload = { calibrated_at: calibratedAt, priors };
  const json = JSON.stringify(payload, null, 2);
  const tmpPath = `${RANKER_PRIORS_PATH}.tmp`;
  await writeFile(tmpPath, json, "utf-8");
  await rename(tmpPath, RANKER_PRIORS_PATH);
}

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const draftRankerCalibrateTools = [
  {
    name: "draft_ranker_calibrate",
    description:
      "Compute ranker priors from signal events and persist to ranker-template-priors.json. " +
      "Requires ≥20 joined events since last calibration. " +
      "Priors are per-category, per-template-subject deltas capped at ±30. " +
      "Hard-rule categories (prepayment, cancellation) are excluded.",
    inputSchema: {
      type: "object",
      properties: {
        dry_run: {
          type: "boolean",
          description:
            "If true, compute and return priors without writing to disk. Defaults to false.",
        },
      },
      required: [],
    },
  },
] as const;

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const draftRankerCalibrateSchema = z.object({
  dry_run: z.boolean().optional().default(false),
});

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function handleDraftRankerCalibrateTool(
  name: string,
  args: unknown,
) {
  if (name !== "draft_ranker_calibrate") {
    return errorResult(`Unknown draft ranker calibrate tool: ${name}`);
  }

  const parsed = draftRankerCalibrateSchema.safeParse(args ?? {});
  if (!parsed.success) {
    return errorResult(`Invalid arguments: ${formatError(parsed.error)}`);
  }

  const { dry_run } = parsed.data;

  // Count events since last calibration to enforce minimum gate.
  const counts = await countSignalEvents(SIGNAL_EVENTS_PATH);
  if (counts.events_since_last_calibration < MIN_EVENTS_GATE) {
    return jsonResult({
      status: "below_minimum_gate",
      message: `Need ≥${MIN_EVENTS_GATE} joined events since last calibration. Currently: ${counts.events_since_last_calibration}.`,
      events_since_last_calibration: counts.events_since_last_calibration,
      minimum_gate: MIN_EVENTS_GATE,
      priors_written: false,
    });
  }

  // Read raw events.
  const { selectionEvents, refinementEvents } = await readSignalEvents(SIGNAL_EVENTS_PATH);
  const pairs = joinEvents(selectionEvents, refinementEvents);

  // Filter to events since last calibration (already counted above — apply same filter).
  let calibrationWindow = pairs;
  try {
    const priorsRaw = await readFile(RANKER_PRIORS_PATH, "utf-8");
    const existing = JSON.parse(priorsRaw) as { calibrated_at: string | null };
    if (existing.calibrated_at) {
      const lastCalibratedAt = existing.calibrated_at;
      calibrationWindow = pairs.filter(
        ({ selection }) => selection.ts > lastCalibratedAt,
      );
    }
  } catch {
    // No existing priors file or invalid JSON — use all events.
  }

  const priors = computePriors(calibrationWindow);
  const calibratedAt = new Date().toISOString();
  const categoriesCalibrated = Object.keys(priors).length;
  const templatesCalibrated = Object.values(priors).reduce(
    (sum, cat) => sum + Object.keys(cat).length,
    0,
  );

  // TASK-08: Archival metadata — populated below if archival runs.
  let archivalResult: {
    archived_count: number;
    retained_count: number;
    archive_path: string | null;
  } | null = null;

  if (!dry_run) {
    await writePriorsAtomic(priors, calibratedAt);
    // Invalidate the in-process priors cache so rankTemplates() picks up new values.
    try {
      const { invalidatePriorsCache } = await import(
        "../utils/template-ranker.js"
      );
      invalidatePriorsCache();
    } catch {
      // Not critical — cache will refresh on next server restart.
    }

    // TASK-08: Best-effort archival — move calibrated events to archive.
    // Uses calibratedAt as the cutoff so all events used in this calibration
    // window are archived. Failures are logged but do not fail calibration.
    try {
      const result = await archiveEvents(calibratedAt, SIGNAL_EVENTS_PATH);
      archivalResult = {
        archived_count: result.archivedCount,
        retained_count: result.retainedCount,
        archive_path: result.archivePath,
      };
      if (result.error) {
        console.warn(`[ranker-calibrate] Archival completed with error: ${result.error}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[ranker-calibrate] Archival failed (best-effort): ${msg}`);
    }
  }

  return jsonResult({
    status: "success",
    calibrated_at: calibratedAt,
    events_in_window: calibrationWindow.length,
    categories_calibrated: categoriesCalibrated,
    templates_calibrated: templatesCalibrated,
    priors_written: !dry_run,
    priors,
    ...(archivalResult ? { archival: archivalResult } : {}),
  });
}

// ---------------------------------------------------------------------------
// Exported path constants (for test use)
// ---------------------------------------------------------------------------

export { RANKER_PRIORS_PATH as CALIBRATE_RANKER_PRIORS_PATH, SIGNAL_EVENTS_PATH as CALIBRATE_SIGNAL_EVENTS_PATH };

