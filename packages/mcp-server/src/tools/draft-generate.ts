import { readFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";

import { handleBriketteResourceRead } from "../resources/brikette-knowledge.js";
import { handleDraftGuideRead } from "../resources/draft-guide.js";
import { handleVoiceExamplesRead } from "../resources/voice-examples.js";
import { generateEmailHtml } from "../utils/email-template.js";
import {
  type EmailTemplate,
  rankTemplates,
} from "../utils/template-ranker.js";
import {
  errorResult,
  formatError,
  jsonResult,
} from "../utils/validation.js";

import { handleDraftQualityTool } from "./draft-quality-check.js";

const DATA_ROOT = join(process.cwd(), "packages", "mcp-server", "data");
const CACHE_TTL_MS = 5 * 60 * 1000;
const templateCache = new Map<string, { data: EmailTemplate[]; expires: number }>();

const draftGenerateSchema = z.object({
  actionPlan: z.object({
    normalized_text: z.string().min(1),
    language: z.enum(["EN", "IT", "ES", "UNKNOWN"]),
    intents: z.object({
      questions: z.array(z.object({ text: z.string().min(1) })).default([]),
      requests: z.array(z.object({ text: z.string().min(1) })).default([]),
      confirmations: z.array(z.object({ text: z.string().min(1) })).default([]),
    }),
    agreement: z.object({
      status: z.enum(["confirmed", "likely", "unclear", "none"]),
      confidence: z.number().min(0).max(100),
      evidence_spans: z.array(
        z.object({
          text: z.string(),
          position: z.number(),
          is_negated: z.boolean(),
        })
      ),
      requires_human_confirmation: z.boolean(),
      detected_language: z.string(),
      additional_content: z.boolean(),
    }),
    workflow_triggers: z.object({
      booking_monitor: z.boolean().optional().default(false),
      prepayment: z.boolean().optional().default(false),
      terms_and_conditions: z.boolean().optional().default(false),
    }),
    scenario: z.object({
      category: z.string().min(1),
      confidence: z.number().min(0).max(1),
    }),
    thread_summary: z
      .object({
        prior_commitments: z.array(z.string()).default([]),
      })
      .optional(),
  }),
  subject: z.string().optional(),
  recipientName: z.string().optional(),
  prepaymentStep: z.enum(["first", "second", "third", "success"]).optional(),
  prepaymentProvider: z.enum(["octorate", "hostelworld"]).optional(),
});

export const draftGenerateTools = [
  {
    name: "draft_generate",
    description: "Generate an email draft using an EmailActionPlan.",
    inputSchema: {
      type: "object",
      properties: {
        actionPlan: { type: "object", description: "EmailActionPlan JSON" },
        subject: { type: "string", description: "Original email subject" },
        recipientName: { type: "string", description: "Guest name for greeting" },
        prepaymentStep: {
          type: "string",
          enum: ["first", "second", "third", "success"],
          description: "Optional prepayment chase step",
        },
        prepaymentProvider: {
          type: "string",
          enum: ["octorate", "hostelworld"],
          description: "Optional prepayment provider",
        },
      },
      required: ["actionPlan"],
    },
  },
] as const;

async function loadTemplates(): Promise<EmailTemplate[]> {
  const cached = templateCache.get("email-templates");
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  const content = await readFile(join(DATA_ROOT, "email-templates.json"), "utf-8");
  const data = JSON.parse(content) as EmailTemplate[];
  templateCache.set("email-templates", {
    data,
    expires: Date.now() + CACHE_TTL_MS,
  });
  return data;
}

function resolveKnowledgeSources(category: string): string[] {
  switch (category) {
    case "faq":
      return ["brikette://faq", "brikette://policies"];
    case "policy":
      return ["brikette://policies"];
    case "payment":
      return ["brikette://policies"];
    case "cancellation":
      return ["brikette://policies"];
    default:
      return ["brikette://faq"];
  }
}

async function loadKnowledgeSummaries(uris: string[]) {
  const summaries: Array<{ uri: string; summary: string }> = [];
  for (const uri of uris) {
    const result = await handleBriketteResourceRead(uri);
    const payload = JSON.parse(result.contents[0].text);
    let summary = "";
    if (Array.isArray(payload)) {
      summary = `items:${payload.length}`;
    } else if (payload && typeof payload === "object") {
      summary = `keys:${Object.keys(payload).length}`;
    } else {
      summary = "unknown";
    }
    summaries.push({ uri, summary });
  }
  return summaries;
}

function ensureSignature(body: string): string {
  const lower = body.toLowerCase();
  if (lower.includes("regards") || lower.includes("hostel brikette")) {
    return body;
  }
  return `${body}\n\nBest regards,\n\nHostel Brikette`;
}

function ensureLength(body: string, category: string): string {
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const min = category === "faq" ? 50 : 80;
  if (wordCount >= min) {
    return body;
  }
  return `${body}\n\nIf you need anything else, please let us know.`;
}

function parseToolResult<T>(result: { content: Array<{ text: string }> }): T {
  return JSON.parse(result.content[0].text) as T;
}

export async function handleDraftGenerateTool(name: string, args: unknown) {
  if (name !== "draft_generate") {
    return errorResult(`Unknown draft generate tool: ${name}`);
  }

  try {
    const {
      actionPlan,
      subject,
      recipientName,
      prepaymentStep,
      prepaymentProvider,
    } = draftGenerateSchema.parse(args);

    const templates = await loadTemplates();

    const rankResult = rankTemplates(templates, {
      subject: subject ?? "",
      body: actionPlan.normalized_text,
      categoryHint: actionPlan.scenario.category,
      prepaymentStep,
      prepaymentProvider,
    });

    const selectedTemplate =
      rankResult.selection === "auto" ? rankResult.candidates[0]?.template : undefined;

    let bodyPlain = selectedTemplate?.body ??
      `Thanks for your email. We will review your request and respond shortly.`;

    bodyPlain = ensureSignature(ensureLength(bodyPlain, actionPlan.scenario.category));

    const bodyHtml = generateEmailHtml({
      recipientName,
      bodyText: bodyPlain,
      includeBookingLink: actionPlan.workflow_triggers.booking_monitor,
      subject,
    });

    const knowledgeUris = resolveKnowledgeSources(actionPlan.scenario.category);
    const knowledgeSummaries = await loadKnowledgeSummaries(knowledgeUris);

    await handleDraftGuideRead();
    await handleVoiceExamplesRead();

    const qualityResponse = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: actionPlan.language,
        intents: { questions: actionPlan.intents.questions },
        workflow_triggers: { booking_monitor: actionPlan.workflow_triggers.booking_monitor },
        scenario: { category: actionPlan.scenario.category },
        thread_summary: actionPlan.thread_summary,
      },
      draft: { bodyPlain, bodyHtml },
    });

    const quality = parseToolResult<{ passed: boolean; failed_checks: string[]; warnings: string[]; confidence: number }>(
      qualityResponse as { content: Array<{ text: string }> }
    );

    return jsonResult({
      draft: {
        bodyPlain,
        bodyHtml,
      },
      answered_questions: actionPlan.intents.questions.map((question) => question.text),
      template_used: selectedTemplate
        ? {
            subject: selectedTemplate.subject,
            category: selectedTemplate.category,
            confidence: rankResult.confidence,
            selection: rankResult.selection,
          }
        : {
            subject: null,
            category: null,
            confidence: rankResult.confidence,
            selection: rankResult.selection,
          },
      knowledge_sources: knowledgeSummaries.map((summary) => summary.uri),
      knowledge_summaries: knowledgeSummaries,
      quality,
      ranker: {
        selection: rankResult.selection,
        candidates: rankResult.candidates.map((candidate) => ({
          subject: candidate.template.subject,
          category: candidate.template.category,
          confidence: candidate.confidence,
          evidence: candidate.evidence,
        })),
      },
    });
  } catch (error) {
    return errorResult(formatError(error));
  }
}

export default handleDraftGenerateTool;
