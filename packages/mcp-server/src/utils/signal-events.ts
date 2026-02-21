import { appendFile, mkdir, readFile } from "fs/promises";
import { dirname, join } from "path";

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
 * Malformed lines are silently skipped.
 */
export async function countSignalEvents(
  filePath: string = DEFAULT_SIGNAL_EVENTS_PATH,
): Promise<SignalCounts> {
  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException | undefined)?.code;
    if (code === "ENOENT") {
      return {
        selection_count: 0,
        refinement_count: 0,
        joined_count: 0,
        events_since_last_calibration: 0,
      };
    }
    throw err;
  }

  const lines = raw.split("\n").filter(Boolean);
  const selectionEvents: SelectionEvent[] = [];
  const refinementEvents: RefinementEvent[] = [];

  for (const line of lines) {
    try {
      const event = JSON.parse(line) as SignalEvent;
      if (event.event === "selection") {
        selectionEvents.push(event as SelectionEvent);
      } else if (event.event === "refinement") {
        refinementEvents.push(event as RefinementEvent);
      }
    } catch {
      // Skip malformed lines.
    }
  }

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
