// TASK-11: draft_refine — additive LLM refinement stage for email drafts.
//
// Accepts a deterministic draft (from draft_generate) and an EmailActionPlan
// (from draft_interpret), applies Claude LLM semantic refinement, and returns
// the improved draft with attribution metadata. Falls back gracefully to the
// original draft when the LLM call fails.

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { errorResult, formatError, jsonResult } from "../utils/validation.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REFINEMENT_MODEL = "claude-haiku-4-5-20251001";

type RefinementSource = "claude-cli" | "none";

type RefineResult = {
  draft: { bodyPlain: string; bodyHtml: string };
  refinement_applied: boolean;
  refinement_source: RefinementSource;
};

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const draftRefineSchema = z.object({
  actionPlan: z.object({
    language: z.enum(["EN", "IT", "ES", "UNKNOWN"]),
    intents: z.object({
      questions: z.array(z.object({ text: z.string() })).default([]),
      requests: z.array(z.object({ text: z.string() })).optional().default([]),
    }),
    scenario: z.object({
      category: z.string().min(1),
    }),
    workflow_triggers: z.object({
      booking_monitor: z.boolean().optional().default(false),
    }),
  }),
  draft: z.object({
    bodyPlain: z.string().min(1),
    bodyHtml: z.string(),
  }),
  context: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Tool definition (registered in index.ts)
// ---------------------------------------------------------------------------

export const draftRefineTools = [
  {
    name: "draft_refine",
    description:
      "Applies LLM-powered semantic refinement to an existing email draft. Accepts a deterministic draft from draft_generate and returns an improved version with attribution metadata. Falls back gracefully to the original draft on LLM failure. Additive only — does not replace draft_generate or draft_quality_check.",
    inputSchema: {
      type: "object",
      properties: {
        actionPlan: {
          type: "object",
          description: "EmailActionPlan from draft_interpret",
        },
        draft: {
          type: "object",
          description:
            "Draft candidate with bodyPlain and bodyHtml from draft_generate",
        },
        context: {
          type: "string",
          description: "Optional additional context for refinement",
        },
      },
      required: ["actionPlan", "draft"],
    },
  },
] as const;

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function handleDraftRefineTool(name: string, args: unknown) {
  if (name !== "draft_refine") {
    return errorResult(`Unknown draft refine tool: ${name}`);
  }

  const parsed = draftRefineSchema.safeParse(args);
  if (!parsed.success) {
    return errorResult(`Invalid arguments: ${formatError(parsed.error)}`);
  }

  const { actionPlan, draft, context } = parsed.data;

  const questions = actionPlan.intents.questions.map((q) => q.text);

  const promptLines = [
    "You are an expert hospitality email writer for Hostel Brikette.",
    "Improve the following draft email to better address the guest's questions.",
    "Keep it professional, warm, and concise.",
    "Output only the improved email body — no preamble, no explanation.",
    "",
    questions.length > 0 ? `Guest questions: ${questions.join("; ")}` : "",
    context ? `Additional context: ${context}` : "",
    "",
    "Current draft:",
    draft.bodyPlain,
  ];

  const prompt = promptLines
    .filter((line) => line !== null && line !== undefined)
    .join("\n")
    .trim();

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: REFINEMENT_MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const firstContent = response.content[0];
    if (firstContent?.type !== "text" || !firstContent.text.trim()) {
      throw new Error("LLM returned empty or non-text content");
    }

    const refinedBody = firstContent.text.trim();

    const result: RefineResult = {
      draft: {
        bodyPlain: refinedBody,
        bodyHtml: draft.bodyHtml, // preserve original HTML; operator can regenerate
      },
      refinement_applied: true,
      refinement_source: "claude-cli",
    };

    return jsonResult(result);
  } catch {
    // Graceful fallback: return original draft unchanged
    const result: RefineResult = {
      draft: {
        bodyPlain: draft.bodyPlain,
        bodyHtml: draft.bodyHtml,
      },
      refinement_applied: false,
      refinement_source: "none",
    };

    return jsonResult(result);
  }
}
