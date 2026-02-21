// TASK-04: draft_template_review — proposal pipeline for email template improvements.
//
// Proposals are generated lazily when `list` is called.
// Only structural rewrites (wrong-template, heavy-rewrite, missing-info) produce proposals.
// Hard-rule categories (prepayment, cancellation) are excluded.
// Approval uses optimistic concurrency + atomic write + linter gate.

import { createHash } from "crypto";
import { appendFile, mkdir, readFile, rename, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { z } from "zod";

import {
  joinEvents,
  readSignalEvents,
} from "../utils/signal-events.js";
import {
  type EmailTemplate,
  lintTemplatesSync,
  partitionIssues,
} from "../utils/template-lint.js";
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

const PROPOSALS_PATH = join(
  process.cwd(),
  "packages",
  "mcp-server",
  "data",
  "template-proposals.jsonl",
);

const TEMPLATES_PATH = join(
  process.cwd(),
  "packages",
  "mcp-server",
  "data",
  "email-templates.json",
);

const PROTECTED_CATEGORIES = new Set(["prepayment", "cancellation"]);

// Rewrite reasons that qualify for proposals (structural, not stylistic).
const PROPOSAL_REWRITE_REASONS = new Set([
  "wrong-template",
  "heavy-rewrite",
  "missing-info",
]);

const PROPOSAL_MAX_AGE_DAYS = 30;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateProposal {
  proposal_id: string;
  composite_key: string;
  review_state: "pending" | "approved" | "rejected" | "auto-rejected";
  scenario_category: string;
  template_subject: string | null;
  is_new_template: boolean;
  proposed_body_redacted: string;
  previous_body_redacted: string | null;
  rewrite_reason: string;
  created_at: string;
}

// Stored template entry structure.
interface TemplateEntry {
  subject: string;
  body: string;
  category: string;
  template_id: string;
  reference_scope: string;
  canonical_reference_url: string | null;
  normalization_batch: string;
}

// ---------------------------------------------------------------------------
// Helpers — normalization_batch increment
// ---------------------------------------------------------------------------

function nextBatchLetter(current: string): string {
  if (!current || current.length !== 1) return "B";
  const next = String.fromCharCode(current.charCodeAt(0) + 1);
  return next;
}

// ---------------------------------------------------------------------------
// Helpers — file I/O
// ---------------------------------------------------------------------------


async function readProposals(): Promise<Map<string, TemplateProposal>> {
  let raw: string;
  try {
    raw = await readFile(PROPOSALS_PATH, "utf-8");
  } catch {
    return new Map();
  }
  const map = new Map<string, TemplateProposal>();
  for (const line of raw.split("\n").filter(Boolean)) {
    try {
      const proposal = JSON.parse(line) as TemplateProposal;
      // Last entry for a given composite_key wins (append-only pattern).
      map.set(proposal.composite_key, proposal);
    } catch {
      // Skip malformed lines.
    }
  }
  return map;
}

async function appendProposal(proposal: TemplateProposal): Promise<void> {
  await mkdir(dirname(PROPOSALS_PATH), { recursive: true });
  await appendFile(PROPOSALS_PATH, `${JSON.stringify(proposal)}\n`, "utf-8");
}

async function readTemplates(): Promise<TemplateEntry[]> {
  const raw = await readFile(TEMPLATES_PATH, "utf-8");
  return JSON.parse(raw) as TemplateEntry[];
}

function hashFileContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function computeProposalId(compositeKey: string): string {
  return `prop-${createHash("sha256").update(compositeKey).digest("hex").substring(0, 8)}`;
}

function deriveSubjectFromBody(body: string): string {
  const firstLine = body.split("\n").find((l) => l.trim().length > 0) ?? "";
  return firstLine.trim().substring(0, 80);
}

// ---------------------------------------------------------------------------
// Proposal generation (lazy, on list)
// ---------------------------------------------------------------------------

async function generatePendingProposals(
  existingProposals: Map<string, TemplateProposal>,
  templates: TemplateEntry[],
): Promise<TemplateProposal[]> {
  const { selectionEvents, refinementEvents } = await readSignalEvents(SIGNAL_EVENTS_PATH);
  const pairs = joinEvents(selectionEvents, refinementEvents);

  const templatesBySubject = new Map(
    templates.map((t) => [t.subject, t]),
  );

  const newProposals: TemplateProposal[] = [];

  for (const { selection, refinement } of pairs) {
    // Filter: only qualifying rewrite reasons.
    if (!PROPOSAL_REWRITE_REASONS.has(refinement.rewrite_reason)) continue;

    // Filter: only when refinement was actually applied.
    if (!refinement.refinement_applied) continue;

    // Filter: exclude hard-rule protected categories.
    if (PROTECTED_CATEGORIES.has(selection.scenario_category)) continue;

    // Filter: requires PII-redacted body to exist.
    const proposedBody = refinement.refined_body_redacted;
    if (!proposedBody) continue;

    const compositeKey = `${selection.draft_id}::${selection.ts}`;

    // Skip if already in proposals (dedup by composite_key).
    if (existingProposals.has(compositeKey)) continue;

    const templateSubject = selection.template_subject;
    const existingTemplate = templateSubject
      ? templatesBySubject.get(templateSubject)
      : null;
    const isNewTemplate = !existingTemplate;

    const proposal: TemplateProposal = {
      proposal_id: computeProposalId(compositeKey),
      composite_key: compositeKey,
      review_state: "pending",
      scenario_category: selection.scenario_category,
      template_subject: templateSubject,
      is_new_template: isNewTemplate,
      proposed_body_redacted: proposedBody,
      previous_body_redacted: existingTemplate?.body ?? null,
      rewrite_reason: refinement.rewrite_reason,
      created_at: new Date().toISOString(),
    };

    await appendProposal(proposal);
    existingProposals.set(compositeKey, proposal);
    newProposals.push(proposal);
  }

  return newProposals;
}

// ---------------------------------------------------------------------------
// Auto-reject check
// ---------------------------------------------------------------------------

function isAutoRejected(proposal: TemplateProposal): boolean {
  const createdAt = new Date(proposal.created_at);
  const ageMs = Date.now() - createdAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays > PROPOSAL_MAX_AGE_DAYS;
}

// ---------------------------------------------------------------------------
// Action: list
// ---------------------------------------------------------------------------

async function handleList(): Promise<unknown> {
  const templates = await readTemplates();
  const existingProposals = await readProposals();

  await generatePendingProposals(existingProposals, templates);

  // Re-read after potential new writes.
  const allProposals = await readProposals();

  const results: Array<{
    proposal_id: string;
    review_state: string;
    scenario_category: string;
    template_subject: string | null;
    is_new_template: boolean;
    rewrite_reason: string;
    created_at: string;
    auto_rejected_reason?: string;
  }> = [];

  for (const [, proposal] of allProposals) {
    let state = proposal.review_state;

    // Auto-reject stale pending proposals.
    if (state === "pending" && isAutoRejected(proposal)) {
      state = "auto-rejected";
      const autoRejected: TemplateProposal = {
        ...proposal,
        review_state: "auto-rejected",
      };
      await appendProposal(autoRejected);
    }

    results.push({
      proposal_id: proposal.proposal_id,
      review_state: state,
      scenario_category: proposal.scenario_category,
      template_subject: proposal.template_subject,
      is_new_template: proposal.is_new_template,
      rewrite_reason: proposal.rewrite_reason,
      created_at: proposal.created_at,
      ...(state === "auto-rejected"
        ? { auto_rejected_reason: "Proposal exceeded 30-day review window" }
        : {}),
    });
  }

  const pendingCount = results.filter((r) => r.review_state === "pending").length;

  return jsonResult({
    proposals: results,
    pending_count: pendingCount,
    total_count: results.length,
  });
}

// ---------------------------------------------------------------------------
// Action: approve
// ---------------------------------------------------------------------------

async function handleApprove(
  proposalId: string,
  expectedFileHash: string,
): Promise<unknown> {
  const allProposals = await readProposals();

  // Find proposal by ID.
  const proposal = Array.from(allProposals.values()).find(
    (p) => p.proposal_id === proposalId,
  );
  if (!proposal) {
    return errorResult(`Proposal not found: ${proposalId}`);
  }
  if (proposal.review_state !== "pending") {
    return errorResult(
      `Proposal ${proposalId} is not pending (state: ${proposal.review_state})`,
    );
  }
  if (isAutoRejected(proposal)) {
    return errorResult(
      `Proposal ${proposalId} has expired (older than ${PROPOSAL_MAX_AGE_DAYS} days)`,
    );
  }

  // Read current templates file and verify hash.
  const templatesRaw = await readFile(TEMPLATES_PATH, "utf-8");
  const actualHash = hashFileContent(templatesRaw);
  if (actualHash !== expectedFileHash) {
    return jsonResult({
      status: "templates_conflict_retry",
      message:
        "email-templates.json has changed since the proposal was listed. " +
        "Re-run `draft_template_review list` to get the current file hash, then retry approval.",
      current_hash: actualHash,
    });
  }

  const templates = JSON.parse(templatesRaw) as TemplateEntry[];
  const existingIndex = templates.findIndex(
    (t) => t.subject === proposal.template_subject,
  );

  let updatedTemplates: TemplateEntry[];

  if (!proposal.is_new_template && existingIndex >= 0) {
    // Patch: update existing template body and advance normalization_batch.
    const existing = templates[existingIndex];
    updatedTemplates = templates.map((t, i) =>
      i === existingIndex
        ? {
            ...t,
            body: proposal.proposed_body_redacted,
            normalization_batch: nextBatchLetter(existing.normalization_batch),
          }
        : t,
    );
  } else {
    // New template: derive next T-number and append.
    const maxTNum = templates
      .map((t) => {
        const match = t.template_id.match(/^T(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .reduce((a, b) => Math.max(a, b), 0);
    const newTemplateId = `T${String(maxTNum + 1).padStart(2, "0")}`;
    const derivedSubject =
      proposal.template_subject ??
      deriveSubjectFromBody(proposal.proposed_body_redacted);
    const newEntry: TemplateEntry = {
      subject: derivedSubject,
      body: proposal.proposed_body_redacted,
      category: proposal.scenario_category,
      template_id: newTemplateId,
      reference_scope: "reference_optional_excluded",
      canonical_reference_url: null,
      normalization_batch: "A",
    };
    updatedTemplates = [...templates, newEntry];
  }

  // Run linter gate.
  const lintIssues = lintTemplatesSync(updatedTemplates as EmailTemplate[]);
  const { hard: hardIssues } = partitionIssues(lintIssues);
  if (hardIssues.length > 0) {
    return errorResult(
      `Linter gate failed after approval write. Hard issues:\n${hardIssues.map((i) => `  [${i.code}] ${i.subject}: ${i.details}`).join("\n")}`,
    );
  }

  // Atomic write: tmp + rename.
  const newContent = JSON.stringify(updatedTemplates, null, 2);
  const tmpPath = `${TEMPLATES_PATH}.tmp`;
  await writeFile(tmpPath, newContent, "utf-8");
  await rename(tmpPath, TEMPLATES_PATH);

  // Mark proposal approved (append-only).
  const approvedProposal: TemplateProposal = {
    ...proposal,
    review_state: "approved",
  };
  await appendProposal(approvedProposal);

  return jsonResult({
    status: "approved",
    proposal_id: proposalId,
    template_subject: proposal.is_new_template
      ? (proposal.template_subject ??
        deriveSubjectFromBody(proposal.proposed_body_redacted))
      : proposal.template_subject,
    is_new_template: proposal.is_new_template,
    templates_updated: true,
  });
}

// ---------------------------------------------------------------------------
// Action: reject
// ---------------------------------------------------------------------------

async function handleReject(proposalId: string): Promise<unknown> {
  const allProposals = await readProposals();
  const proposal = Array.from(allProposals.values()).find(
    (p) => p.proposal_id === proposalId,
  );
  if (!proposal) {
    return errorResult(`Proposal not found: ${proposalId}`);
  }
  if (proposal.review_state !== "pending") {
    return errorResult(
      `Proposal ${proposalId} is not pending (state: ${proposal.review_state})`,
    );
  }

  const rejectedProposal: TemplateProposal = {
    ...proposal,
    review_state: "rejected",
  };
  await appendProposal(rejectedProposal);

  return jsonResult({ status: "rejected", proposal_id: proposalId });
}

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

export const draftTemplateReviewTools = [
  {
    name: "draft_template_review",
    description:
      "Manage email template improvement proposals. " +
      "List pending proposals (lazily generated from signal events), " +
      "approve a proposal (writes to email-templates.json with optimistic concurrency), " +
      "or reject a proposal. " +
      "Hard-rule categories (prepayment, cancellation) are excluded. " +
      "Proposals older than 30 days are auto-rejected.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["list", "approve", "reject"],
          description: "Action to perform",
        },
        proposal_id: {
          type: "string",
          description: "Proposal ID (required for approve and reject actions)",
        },
        expected_file_hash: {
          type: "string",
          description:
            "SHA-256 hash of email-templates.json at list time (required for approve). " +
            "Prevents blind overwrites if the file has changed since listing.",
        },
      },
      required: ["action"],
    },
  },
] as const;

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const draftTemplateReviewSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list") }),
  z.object({
    action: z.literal("approve"),
    proposal_id: z.string().min(1),
    expected_file_hash: z.string().min(1),
  }),
  z.object({
    action: z.literal("reject"),
    proposal_id: z.string().min(1),
  }),
]);

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function handleDraftTemplateReviewTool(
  name: string,
  args: unknown,
) {
  if (name !== "draft_template_review") {
    return errorResult(`Unknown draft template review tool: ${name}`);
  }

  const parsed = draftTemplateReviewSchema.safeParse(args);
  if (!parsed.success) {
    return errorResult(`Invalid arguments: ${formatError(parsed.error)}`);
  }

  const input = parsed.data;

  switch (input.action) {
    case "list":
      return handleList();
    case "approve":
      return handleApprove(input.proposal_id, input.expected_file_hash);
    case "reject":
      return handleReject(input.proposal_id);
  }
}

// ---------------------------------------------------------------------------
// Exported path constants and helpers (for test use)
// ---------------------------------------------------------------------------

export {
  hashFileContent,
  PROPOSALS_PATH as TEMPLATE_PROPOSALS_PATH,
  TEMPLATES_PATH as TEMPLATE_REVIEW_TEMPLATES_PATH,
};
