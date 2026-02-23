import { appendFile, mkdir, readFile, stat, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { z } from "zod";

// Path to ranker priors — read by countSignalEvents for calibration window.
const RANKER_PRIORS_PATH = join(
  process.cwd(),
  "packages",
  "mcp-server",
  "data",
  "ranker-template-priors.json",
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RewriteReason =
  | "none"
  | "style"
  | "language-adapt"
  | "light-edit"
  | "heavy-rewrite"
  | "missing-info"
  | "wrong-template";

export interface SelectionEvent {
  event: "selection";
  draft_id: string;
  ts: string;
  template_subject: string | null;
  template_category: string | null;
  selection: string;
  scenario_category: string;
  scenario_category_raw: string;
}

export interface RefinementEvent {
  event: "refinement";
  draft_id: string;
  ts: string;
  rewrite_reason: RewriteReason;
  refinement_applied: boolean;
  refinement_source: string;
  edit_distance_pct: number;
  // TASK-04: PII-redacted body of the refined draft (present when refinement_applied = true).
  // Used by draft_template_review to generate proposal bodies without operator re-entry.
  refined_body_redacted?: string;
}

export type SignalEvent = SelectionEvent | RefinementEvent;

// ---------------------------------------------------------------------------
// Zod schemas (TASK-04: schema validation on read)
// ---------------------------------------------------------------------------

const SelectionEventSchema = z.object({
  event: z.literal("selection"),
  draft_id: z.string(),
  ts: z.string(),
  template_subject: z.string().nullable(),
  template_category: z.string().nullable(),
  selection: z.string(),
  scenario_category: z.string(),
  scenario_category_raw: z.string(),
}).passthrough();

const RefinementEventSchema = z.object({
  event: z.literal("refinement"),
  draft_id: z.string(),
  ts: z.string(),
  rewrite_reason: z.enum([
    "none",
    "style",
    "language-adapt",
    "light-edit",
    "heavy-rewrite",
    "missing-info",
    "wrong-template",
  ]),
  refinement_applied: z.boolean(),
  refinement_source: z.string(),
  edit_distance_pct: z.number(),
  refined_body_redacted: z.string().optional(),
}).passthrough();

const SignalEventSchema = z.discriminatedUnion("event", [
  SelectionEventSchema,
  RefinementEventSchema,
]);

export interface SignalCounts {
  selection_count: number;
  refinement_count: number;
  joined_count: number;
  events_since_last_calibration: number;
}

// ---------------------------------------------------------------------------
// Default path
// ---------------------------------------------------------------------------

export const DEFAULT_SIGNAL_EVENTS_PATH = join(
  process.cwd(),
  "packages",
  "mcp-server",
  "data",
  "draft-signal-events.jsonl",
);

export const DEFAULT_ARCHIVE_DIR = join(
  process.cwd(),
  "packages",
  "mcp-server",
  "data",
  "archive",
);

// ---------------------------------------------------------------------------
// Archival types
// ---------------------------------------------------------------------------

export interface ArchiveResult {
  archivedCount: number;
  retainedCount: number;
  archivePath: string | null;
  sizeWarning?: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Size thresholds (bytes)
// ---------------------------------------------------------------------------

const SIZE_WARN_THRESHOLD = 512_000; // 500KB
const SIZE_AUTO_ARCHIVE_THRESHOLD = 1_048_576; // 1MB

// ---------------------------------------------------------------------------
// Category normalization
// ---------------------------------------------------------------------------

const KNOWN_CATEGORIES = new Set([
  "cancellation",
  "payment",
  "policy",
  "breakfast",
  "luggage",
  "wifi",
  "check-in",
  "checkout",
  "prepayment",
  "transportation",
  "house-rules",
  "booking-changes",
  "booking-issues",
  "access",
  "lost-found",
  "activities",
  "promotions",
  "employment",
  "general",
  "faq",
]);

/**
 * Normalize an email scenario category for storage.
 * Known categories pass through; unknown categories map to "general"
 * while the raw value is retained in `scenario_category_raw` for audit.
 */
export function normalizeSignalCategory(raw: string): {
  scenario_category: string;
  scenario_category_raw: string;
} {
  const lower = raw.toLowerCase();
  return {
    scenario_category: KNOWN_CATEGORIES.has(lower) ? lower : "general",
    scenario_category_raw: raw,
  };
}

// ---------------------------------------------------------------------------
// Edit distance
// ---------------------------------------------------------------------------

/**
 * Compute token-level Levenshtein edit distance percentage between two strings.
 * Returns a value in [0, 1] where 0 = identical and 1 = completely different.
 * The result is rounded to 2 decimal places.
 */
export function editDistancePct(a: string, b: string): number {
  const tokensA = a.trim().split(/\s+/).filter(Boolean);
  const tokensB = b.trim().split(/\s+/).filter(Boolean);

  if (tokensA.length === 0 && tokensB.length === 0) {
    return 0;
  }
  if (tokensA.length === 0 || tokensB.length === 0) {
    return 1;
  }

  const m = tokensA.length;
  const n = tokensB.length;

  // Standard Levenshtein DP over token arrays.
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (tokensA[i - 1] === tokensB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  const distance = dp[m][n];
  const maxLen = Math.max(m, n);
  return Math.round((distance / maxLen) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Centralized JSONL reader with schema validation (TASK-04)
// ---------------------------------------------------------------------------

export interface ReadSignalEventsResult {
  selectionEvents: SelectionEvent[];
  refinementEvents: RefinementEvent[];
  skippedCount: number;
}

/**
 * Read and validate signal events from a JSONL file using Zod schemas.
 * Returns typed arrays of selection and refinement events, plus a count of
 * skipped lines (malformed JSON, failed schema validation, unrecognized event type).
 * Blank lines are silently ignored (not counted as skipped).
 * Returns empty result if the file does not exist.
 *
 * TASK-08: If the active file exceeds 1MB, triggers automatic archival before
 * parsing. This is a fallback mechanism to prevent unbounded file growth.
 */
export async function readSignalEvents(
  filePath: string = DEFAULT_SIGNAL_EVENTS_PATH,
): Promise<ReadSignalEventsResult> {
  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException | undefined)?.code;
    if (code === "ENOENT") {
      return { selectionEvents: [], refinementEvents: [], skippedCount: 0 };
    }
    throw err;
  }

  // TASK-08: 1MB fallback trigger — auto-archive if file is too large.
  if (Buffer.byteLength(raw, "utf-8") > SIZE_AUTO_ARCHIVE_THRESHOLD) {
    console.warn(
      `[signal-events] Active file exceeds 1MB (${Buffer.byteLength(raw, "utf-8")} bytes) — triggering automatic archival`,
    );
    try {
      const cutoff = new Date().toISOString();
      await archiveEvents(cutoff, filePath);
      // Re-read the (now smaller) active file
      raw = await readFile(filePath, "utf-8");
    } catch {
      // Archival failed — continue with the original data
    }
  }

  const lines = raw.split("\n");
  const selectionEvents: SelectionEvent[] = [];
  const refinementEvents: RefinementEvent[] = [];
  let skippedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      skippedCount++;
      console.warn(`[signal-events] Skipped malformed JSON at line ${i + 1}`);
      continue;
    }

    const result = SignalEventSchema.safeParse(parsed);
    if (!result.success) {
      skippedCount++;
      console.warn(
        `[signal-events] Skipped invalid event at line ${i + 1}: ${result.error.issues[0]?.message ?? "unknown"}`,
      );
      continue;
    }

    const event = result.data;
    if (event.event === "selection") {
      selectionEvents.push(event as SelectionEvent);
    } else if (event.event === "refinement") {
      refinementEvents.push(event as RefinementEvent);
    }
  }

  return { selectionEvents, refinementEvents, skippedCount };
}

// ---------------------------------------------------------------------------
// Archival (TASK-08)
// ---------------------------------------------------------------------------

/**
 * Archive signal events older than or equal to `cutoffTimestamp`.
 *
 * - Reads all raw lines from the active JSONL file.
 * - Splits lines into "to archive" (ts <= cutoff) and "to retain" (ts > cutoff).
 * - Appends archived lines to `archiveDir/draft-signal-events-YYYY-MM-DD.jsonl`
 *   (date derived from cutoffTimestamp). Append avoids overwriting existing archives.
 * - Rewrites the active file with only the retained lines.
 * - Creates archive directory if missing.
 * - Best-effort: never throws. Returns an error string if archival fails.
 *
 * Atomicity: archive file is written first, then active file is truncated.
 * If the archive write succeeds but the active truncation fails, events may
 * be duplicated across archive and active — but no data is lost.
 */
export async function archiveEvents(
  cutoffTimestamp: string,
  filePath: string = DEFAULT_SIGNAL_EVENTS_PATH,
  archiveDir: string = DEFAULT_ARCHIVE_DIR,
): Promise<ArchiveResult> {
  try {
    // Read raw file content
    let raw: string;
    try {
      raw = await readFile(filePath, "utf-8");
    } catch (err) {
      const code = (err as NodeJS.ErrnoException | undefined)?.code;
      if (code === "ENOENT") {
        return { archivedCount: 0, retainedCount: 0, archivePath: null };
      }
      throw err;
    }

    const lines = raw.split("\n");
    const toArchive: string[] = [];
    const toRetain: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const parsed = JSON.parse(trimmed) as { ts?: string };
        if (parsed.ts && parsed.ts <= cutoffTimestamp) {
          toArchive.push(trimmed);
        } else {
          toRetain.push(trimmed);
        }
      } catch {
        // Malformed JSON — retain it so it isn't silently lost
        toRetain.push(trimmed);
      }
    }

    // Nothing to archive — early return
    if (toArchive.length === 0) {
      const retainedContent = toRetain.length > 0
        ? toRetain.join("\n") + "\n"
        : "";
      const sizeWarning = Buffer.byteLength(retainedContent, "utf-8") > SIZE_WARN_THRESHOLD;
      if (sizeWarning) {
        console.warn(
          `[signal-events] Active file exceeds 500KB after archival (${toRetain.length} events retained)`,
        );
      }
      return {
        archivedCount: 0,
        retainedCount: toRetain.length,
        archivePath: null,
        sizeWarning,
      };
    }

    // Derive archive filename from cutoff date
    const cutoffDate = cutoffTimestamp.slice(0, 10); // YYYY-MM-DD
    const archiveFilename = `draft-signal-events-${cutoffDate}.jsonl`;
    const archivePath = join(archiveDir, archiveFilename);

    // Create archive directory if missing
    await mkdir(archiveDir, { recursive: true });

    // Append archived events to the archive file (append to avoid overwriting)
    const archiveContent = toArchive.join("\n") + "\n";
    await appendFile(archivePath, archiveContent, "utf-8");

    // Rewrite active file with only retained events
    const retainedContent = toRetain.length > 0
      ? toRetain.join("\n") + "\n"
      : "";
    await writeFile(filePath, retainedContent, "utf-8");

    // Size warning check
    const sizeWarning = Buffer.byteLength(retainedContent, "utf-8") > SIZE_WARN_THRESHOLD;
    if (sizeWarning) {
      console.warn(
        `[signal-events] Active file exceeds 500KB after archival (${toRetain.length} events retained)`,
      );
    }

    return {
      archivedCount: toArchive.length,
      retainedCount: toRetain.length,
      archivePath,
      sizeWarning,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[signal-events] Archival failed: ${message}`);
    return {
      archivedCount: 0,
      retainedCount: 0,
      archivePath: null,
      error: message,
    };
  }
}

/**
 * Check file size and trigger automatic archival if the active signal events
 * file exceeds the 1MB threshold. Used as a fallback trigger independent of
 * calibration. Returns true if auto-archival was triggered.
 */
export async function checkAndAutoArchive(
  filePath: string = DEFAULT_SIGNAL_EVENTS_PATH,
  archiveDir: string = DEFAULT_ARCHIVE_DIR,
): Promise<boolean> {
  try {
    const fileStat = await stat(filePath);
    if (fileStat.size > SIZE_AUTO_ARCHIVE_THRESHOLD) {
      console.warn(
        `[signal-events] Active file exceeds 1MB (${fileStat.size} bytes) — triggering automatic archival`,
      );
      const cutoff = new Date().toISOString();
      await archiveEvents(cutoff, filePath, archiveDir);
      return true;
    }
  } catch {
    // File doesn't exist or stat failed — nothing to archive
  }
  return false;
}

// ---------------------------------------------------------------------------
// JSONL append
// ---------------------------------------------------------------------------

/**
 * Append a signal event as a newline-terminated JSONL entry.
 * Creates the parent directory and file if they do not exist.
 * Best-effort: callers should `.catch(() => {})` to prevent draft failures.
 */
export async function appendJsonlEvent(
  filePath: string,
  event: SignalEvent,
): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await appendFile(filePath, `${JSON.stringify(event)}\n`, "utf-8");
}

// ---------------------------------------------------------------------------
// Join utility
// ---------------------------------------------------------------------------

/**
 * Join selection and refinement events by draft_id.
 * Orphaned events (no matching pair) are excluded from the result.
 * Multiple refinements for the same draft_id: only the first is used.
 */
export function joinEvents(
  selectionEvents: SelectionEvent[],
  refinementEvents: RefinementEvent[],
): Array<{ selection: SelectionEvent; refinement: RefinementEvent }> {
  const refinementByDraftId = new Map<string, RefinementEvent>();
  for (const event of refinementEvents) {
    if (!refinementByDraftId.has(event.draft_id)) {
      refinementByDraftId.set(event.draft_id, event);
    }
  }

  const pairs: Array<{ selection: SelectionEvent; refinement: RefinementEvent }> = [];
  for (const selection of selectionEvents) {
    const refinement = refinementByDraftId.get(selection.draft_id);
    if (refinement) {
      pairs.push({ selection, refinement });
    }
  }

  return pairs;
}

// ---------------------------------------------------------------------------
// Count helper
// ---------------------------------------------------------------------------

/**
 * Read and count signal events from a JSONL file.
 * Returns all-zero counts if the file does not exist.
 * Uses centralized readSignalEvents() with Zod validation.
 */
export async function countSignalEvents(
  filePath: string = DEFAULT_SIGNAL_EVENTS_PATH,
): Promise<SignalCounts> {
  const { selectionEvents, refinementEvents } = await readSignalEvents(filePath);

  const joined = joinEvents(selectionEvents, refinementEvents);

  // TASK-05: read calibrated_at from ranker-template-priors.json to compute
  // events_since_last_calibration (only events after the last calibration).
  let calibratedAt: string | null = null;
  try {
    const priorsRaw = await readFile(RANKER_PRIORS_PATH, "utf-8");
    const priors = JSON.parse(priorsRaw) as { calibrated_at: string | null };
    calibratedAt = priors.calibrated_at ?? null;
  } catch {
    // File not found or invalid JSON — no calibration recorded yet.
  }

  const eventsSinceCalibration = calibratedAt
    ? joined.filter(({ selection }) => selection.ts > calibratedAt!).length
    : joined.length;

  return {
    selection_count: selectionEvents.length,
    refinement_count: refinementEvents.length,
    joined_count: joined.length,
    events_since_last_calibration: eventsSinceCalibration,
  };
}
