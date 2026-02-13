import { createHash } from "crypto";
import { z } from "zod";

import {
  BosAgentClientError,
  getBosStageDoc,
  listBosCards,
  patchBosStageDoc,
} from "../lib/bos-agent-client.js";
import { wave2ProvenanceSchema } from "../lib/wave2-contracts.js";
import { formatError, jsonResult } from "../utils/validation.js";

import {
  parsePolicyMap,
  preflightToolCallPolicy,
  redactSensitiveFields,
  type ToolCallResult,
  type ToolErrorCode,
} from "./policy.js";

const STARTUP_LOOP_STAGES = [
  "S0",
  "S1",
  "S1B",
  "S2A",
  "S2",
  "S2B",
  "S3",
  "S4",
  "S5A",
  "S5B",
  "S6",
  "S6B",
  "S7",
  "S8",
  "S9",
  "S9B",
  "S10",
] as const;

const cardsListSchema = z.object({
  business: z.string().min(1),
  runId: z.string().min(1),
  current_stage: z.string().min(1),
  lane: z.string().min(1).optional(),
});

const stageDocGetSchema = z.object({
  business: z.string().min(1),
  cardId: z.string().min(1),
  stage: z.string().min(1),
  runId: z.string().min(1),
  current_stage: z.string().min(1),
});

const stageDocPatchSchema = z.object({
  business: z.string().min(1),
  cardId: z.string().min(1),
  stage: z.string().min(1),
  runId: z.string().min(1),
  current_stage: z.string().min(1),
  write_reason: z.string().min(1),
  baseEntitySha: z.string().min(1),
  patch: z.record(z.unknown()),
});

const expAllocateIdSchema = z.object({
  business: z.string().min(1),
  runId: z.string().min(1),
  current_stage: z.string().min(1),
  hypothesisId: z.string().min(1),
  seed: z.string().min(1).default("default"),
});

const expVariantSchema = z.object({
  id: z.string().min(1),
  weight: z.number().positive(),
});

const expRegisterSchema = z.object({
  business: z.string().min(1),
  cardId: z.string().min(1),
  stage: z.string().min(1),
  runId: z.string().min(1),
  current_stage: z.string().min(1),
  write_reason: z.string().min(1),
  baseEntitySha: z.string().min(1),
  auditTag: z.string().min(1),
  provenance: wave2ProvenanceSchema,
  experiment: z
    .object({
      experimentId: z.string().min(1),
      hypothesisId: z.string().min(1),
      metric: z.string().min(1),
      allocationUnit: z.string().min(1),
      rolloutPercent: z.number().min(0).max(100),
      variants: z.array(expVariantSchema).min(2),
    })
    .superRefine((value, ctx) => {
      const totalWeight = value.variants.reduce((sum, variant) => sum + variant.weight, 0);
      if (Math.abs(totalWeight - 1) > 0.001) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Experiment variant weights must sum to 1.",
          path: ["variants"],
        });
      }
    }),
});

const expRolloutStatusSchema = z.object({
  business: z.string().min(1),
  runId: z.string().min(1),
  current_stage: z.string().min(1),
  experimentId: z.string().min(1),
  requestedBy: z.string().min(1).default("startup-loop"),
  plannedRolloutPercent: z.number().min(0).max(100).default(0),
  activeRolloutPercent: z.number().min(0).max(100).default(0),
  assignmentCount: z.number().int().nonnegative().default(0),
});

const expResultsArmSchema = z
  .object({
    exposures: z.number().int().nonnegative(),
    conversions: z.number().int().nonnegative(),
    revenue: z.number().nonnegative().default(0),
  })
  .superRefine((value, ctx) => {
    if (value.conversions > value.exposures) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Conversions cannot exceed exposures.",
      });
    }
  });

const expResultsSnapshotSchema = z.object({
  business: z.string().min(1),
  runId: z.string().min(1),
  current_stage: z.string().min(1),
  experimentId: z.string().min(1),
  control: expResultsArmSchema,
  treatment: expResultsArmSchema,
});

const opsUpdatePriceGuardedSchema = z.object({
  business: z.string().min(1),
  cardId: z.string().min(1),
  stage: z.string().min(1),
  runId: z.string().min(1),
  current_stage: z.string().min(1),
  write_reason: z.string().min(1),
  baseEntitySha: z.string().min(1),
  auditTag: z.string().min(1),
  provenance: wave2ProvenanceSchema,
  operation: z.object({
    action: z.literal("update_price"),
    sku: z.string().min(1),
    currency: z.string().min(1),
    oldPrice: z.number().nonnegative(),
    newPrice: z.number().nonnegative(),
    approvalToken: z.string().optional(),
  }),
});

export const bosToolPoliciesRaw = {
  bos_cards_list: {
    permission: "read",
    sideEffects: "none",
    allowedStages: [...STARTUP_LOOP_STAGES],
    auditTag: "bos:cards:list",
    contextRequired: ["business", "runId", "current_stage"],
    sensitiveFields: ["baseEntitySha"],
  },
  bos_stage_doc_get: {
    permission: "read",
    sideEffects: "none",
    allowedStages: [...STARTUP_LOOP_STAGES],
    auditTag: "bos:stage-doc:get",
    contextRequired: ["business", "cardId", "runId", "current_stage"],
    sensitiveFields: ["baseEntitySha"],
  },
  bos_stage_doc_patch_guarded: {
    permission: "guarded_write",
    sideEffects: "bos_write",
    allowedStages: ["S5B", "S7", "S8", "S9", "S9B", "S10"],
    auditTag: "bos:stage-doc:patch",
    contextRequired: ["business", "cardId", "runId", "current_stage"],
    requiresEntitySha: true,
    sensitiveFields: ["baseEntitySha"],
  },
  exp_allocate_id: {
    permission: "read",
    sideEffects: "none",
    allowedStages: [...STARTUP_LOOP_STAGES],
    auditTag: "exp:allocate-id",
    contextRequired: ["business", "runId", "current_stage"],
    sensitiveFields: [],
  },
  exp_register: {
    permission: "guarded_write",
    sideEffects: "bos_write",
    allowedStages: ["S7", "S8", "S9", "S9B", "S10"],
    auditTag: "exp:register:guarded",
    contextRequired: ["business", "cardId", "runId", "current_stage"],
    requiresEntitySha: true,
    sensitiveFields: ["baseEntitySha", "approvalToken"],
  },
  exp_rollout_status: {
    permission: "read",
    sideEffects: "none",
    allowedStages: [...STARTUP_LOOP_STAGES],
    auditTag: "exp:rollout:status",
    contextRequired: ["business", "runId", "current_stage"],
    sensitiveFields: [],
  },
  exp_results_snapshot: {
    permission: "read",
    sideEffects: "none",
    allowedStages: [...STARTUP_LOOP_STAGES],
    auditTag: "exp:results:snapshot",
    contextRequired: ["business", "runId", "current_stage"],
    sensitiveFields: [],
  },
  ops_update_price_guarded: {
    permission: "guarded_write",
    sideEffects: "bos_write",
    allowedStages: ["S8", "S9", "S9B", "S10"],
    auditTag: "ops:update-price:guarded",
    contextRequired: ["business", "cardId", "runId", "current_stage"],
    requiresEntitySha: true,
    sensitiveFields: ["baseEntitySha", "approvalToken"],
  },
} as const;

export const bosTools = [
  {
    name: "bos_cards_list",
    description: "List Business OS cards for a business with startup-loop context",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code (for example BRIK)" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
        lane: { type: "string", description: "Optional lane filter" },
      },
      required: ["business", "runId", "current_stage"],
    },
  },
  {
    name: "bos_stage_doc_get",
    description: "Fetch a Business OS stage doc with entitySha for startup-loop workflows",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code (for example BRIK)" },
        cardId: { type: "string", description: "Business OS card ID" },
        stage: { type: "string", description: "Stage doc type" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
      },
      required: ["business", "cardId", "stage", "runId", "current_stage"],
    },
  },
  {
    name: "bos_stage_doc_patch_guarded",
    description:
      "Guarded PATCH for Business OS stage docs with optimistic concurrency (no automatic retry)",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code (for example BRIK)" },
        cardId: { type: "string", description: "Business OS card ID" },
        stage: { type: "string", description: "Stage doc type" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
        write_reason: { type: "string", description: "Reason for guarded write" },
        baseEntitySha: { type: "string", description: "Optimistic concurrency base SHA" },
        patch: { type: "object", description: "JSON merge patch payload" },
      },
      required: [
        "business",
        "cardId",
        "stage",
        "runId",
        "current_stage",
        "write_reason",
        "baseEntitySha",
        "patch",
      ],
    },
  },
  {
    name: "exp_allocate_id",
    description: "Allocate a deterministic experiment identifier for startup-loop runtime",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code (for example BRIK)" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
        hypothesisId: { type: "string", description: "Hypothesis identifier being promoted" },
        seed: { type: "string", description: "Stable seed for deterministic id allocation" },
      },
      required: ["business", "runId", "current_stage", "hypothesisId"],
    },
  },
  {
    name: "exp_register",
    description: "Register experiment runtime metadata via guarded stage-doc patch semantics",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code (for example BRIK)" },
        cardId: { type: "string", description: "Business OS card ID" },
        stage: { type: "string", description: "Experiment runtime stage doc key" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
        write_reason: { type: "string", description: "Reason for guarded write" },
        baseEntitySha: { type: "string", description: "Optimistic concurrency base SHA" },
        auditTag: { type: "string", description: "Audit envelope tag" },
        provenance: { type: "object", description: "Wave-2 provenance envelope" },
        experiment: { type: "object", description: "Experiment registration payload" },
      },
      required: [
        "business",
        "cardId",
        "stage",
        "runId",
        "current_stage",
        "write_reason",
        "baseEntitySha",
        "auditTag",
        "provenance",
        "experiment",
      ],
    },
  },
  {
    name: "exp_rollout_status",
    description: "Return bounded rollout status for an experiment runtime id",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code (for example BRIK)" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
        experimentId: { type: "string", description: "Experiment identifier" },
        requestedBy: { type: "string", description: "Operator or agent requesting status" },
        plannedRolloutPercent: { type: "number", description: "Planned rollout percentage" },
        activeRolloutPercent: { type: "number", description: "Active rollout percentage" },
        assignmentCount: { type: "number", description: "Count of assigned entities" },
      },
      required: ["business", "runId", "current_stage", "experimentId"],
    },
  },
  {
    name: "exp_results_snapshot",
    description: "Return deterministic experiment results snapshot with effect-size calculations",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code (for example BRIK)" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
        experimentId: { type: "string", description: "Experiment identifier" },
        control: { type: "object", description: "Control arm counts" },
        treatment: { type: "object", description: "Treatment arm counts" },
      },
      required: ["business", "runId", "current_stage", "experimentId", "control", "treatment"],
    },
  },
  {
    name: "ops_update_price_guarded",
    description: "Guarded ops pilot envelope for price updates with audit and concurrency tokens",
    inputSchema: {
      type: "object",
      properties: {
        business: { type: "string", description: "Business code (for example BRIK)" },
        cardId: { type: "string", description: "Business OS card ID" },
        stage: { type: "string", description: "Ops runtime stage doc key" },
        runId: { type: "string", description: "Startup-loop run identifier" },
        current_stage: { type: "string", description: "Current startup-loop stage" },
        write_reason: { type: "string", description: "Reason for guarded write" },
        baseEntitySha: { type: "string", description: "Optimistic concurrency base SHA" },
        auditTag: { type: "string", description: "Audit envelope tag" },
        provenance: { type: "object", description: "Wave-2 provenance envelope" },
        operation: { type: "object", description: "Guarded ops operation payload" },
      },
      required: [
        "business",
        "cardId",
        "stage",
        "runId",
        "current_stage",
        "write_reason",
        "baseEntitySha",
        "auditTag",
        "provenance",
        "operation",
      ],
    },
  },
] as const;

const bosKnownToolNames = new Set(bosTools.map((tool) => tool.name));
const bosPolicyMap = parsePolicyMap(bosToolPoliciesRaw);

function toolError(
  code: ToolErrorCode,
  message: string,
  retryable: boolean,
  details?: Record<string, unknown>
): ToolCallResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            error: {
              code,
              message,
              retryable,
              details,
            },
          },
          null,
          2
        ),
      },
    ],
    isError: true,
  };
}

function toOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function shapeCard(card: Record<string, unknown>) {
  return {
    id: toOptionalString(card.ID),
    business: toOptionalString(card.Business),
    title: toOptionalString(card.Title),
    lane: toOptionalString(card.Lane),
    priority: toOptionalString(card.Priority),
    owner: toOptionalString(card.Owner),
    featureSlug: toOptionalString(card["Feature-Slug"]),
    planLink: toOptionalString(card["Plan-Link"]),
    lastProgress: toOptionalString(card["Last-Progress"]),
    created: toOptionalString(card.Created),
    updated: toOptionalString(card.Updated),
    dueDate: toOptionalString(card["Due-Date"]),
  };
}

function shapeStageDoc(entity: Record<string, unknown>, entitySha: string) {
  return {
    cardId: toOptionalString(entity["Card-ID"]),
    stage: toOptionalString(entity.Stage),
    created: toOptionalString(entity.Created),
    updated: toOptionalString(entity.Updated),
    content: toOptionalString(entity.content),
    entitySha,
  };
}

function deterministicExperimentId(
  business: string,
  runId: string,
  hypothesisId: string,
  seed: string
): string {
  const hash = createHash("sha256")
    .update(`${business}:${runId}:${hypothesisId}:${seed}`)
    .digest("hex")
    .toUpperCase();
  return `EXP-${hash.slice(0, 10)}`;
}

function safeRate(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }
  return numerator / denominator;
}

function buildGuardedAuditEnvelope(input: {
  auditTag: string;
  writeReason: string;
  request: Record<string, unknown>;
}): {
  auditTag: string;
  writeReason: string;
  generatedAt: string;
  request: unknown;
} {
  return {
    auditTag: input.auditTag,
    writeReason: input.writeReason,
    generatedAt: new Date().toISOString(),
    request: redactSensitiveFields(input.request, ["write_reason", "baseEntitySha", "approvalToken"]),
  };
}

function mapBosError(error: unknown): ToolCallResult {
  if (error instanceof BosAgentClientError) {
    return toolError(error.code, error.message, error.retryable, error.details);
  }

  if (error instanceof z.ZodError) {
    return toolError("CONTRACT_MISMATCH", formatError(error), false);
  }

  return toolError("INTERNAL_ERROR", formatError(error), false);
}

export async function handleBosTool(name: string, args: unknown): Promise<ToolCallResult> {
  try {
    const preflightError = preflightToolCallPolicy({
      toolName: name,
      args,
      knownToolNames: bosKnownToolNames,
      policyMap: bosPolicyMap,
    });

    if (preflightError) {
      return preflightError;
    }

    switch (name) {
      case "bos_cards_list": {
        const parsed = cardsListSchema.parse(args);
        const cards = await listBosCards({
          business: parsed.business,
          lane: parsed.lane,
        });

        return jsonResult({
          business: parsed.business,
          lane: parsed.lane ?? null,
          count: cards.length,
          cards: cards.map((card) => shapeCard(card)),
        });
      }

      case "bos_stage_doc_get": {
        const parsed = stageDocGetSchema.parse(args);
        const payload = await getBosStageDoc({
          cardId: parsed.cardId,
          stage: parsed.stage,
        });

        return jsonResult({
          business: parsed.business,
          cardId: parsed.cardId,
          stage: parsed.stage,
          stageDoc: shapeStageDoc(payload.entity, payload.entitySha),
        });
      }

      case "bos_stage_doc_patch_guarded": {
        const parsed = stageDocPatchSchema.parse(args);
        const payload = await patchBosStageDoc({
          cardId: parsed.cardId,
          stage: parsed.stage,
          baseEntitySha: parsed.baseEntitySha,
          patch: parsed.patch,
        });

        return jsonResult({
          business: parsed.business,
          cardId: parsed.cardId,
          stage: parsed.stage,
          writeReason: parsed.write_reason,
          stageDoc: shapeStageDoc(payload.entity, payload.entitySha),
        });
      }

      case "exp_allocate_id": {
        const parsed = expAllocateIdSchema.parse(args);
        const experimentId = deterministicExperimentId(
          parsed.business,
          parsed.runId,
          parsed.hypothesisId,
          parsed.seed
        );

        return jsonResult({
          schemaVersion: "exp.allocate-id.v1",
          business: parsed.business,
          runId: parsed.runId,
          hypothesisId: parsed.hypothesisId,
          experimentId,
          allocationKey: `${parsed.business}:${parsed.runId}:${parsed.hypothesisId}:${parsed.seed}`,
        });
      }

      case "exp_register": {
        const parsed = expRegisterSchema.parse(args);
        const payload = await patchBosStageDoc({
          cardId: parsed.cardId,
          stage: parsed.stage,
          baseEntitySha: parsed.baseEntitySha,
          patch: {
            experimentRuntime: {
              schemaVersion: "exp.register.v1",
              ...parsed.experiment,
              auditTag: parsed.auditTag,
              writeReason: parsed.write_reason,
              provenance: parsed.provenance,
            },
          },
        });

        return jsonResult({
          schemaVersion: "exp.register.result.v1",
          business: parsed.business,
          runId: parsed.runId,
          cardId: parsed.cardId,
          stage: parsed.stage,
          experiment: parsed.experiment,
          provenance: parsed.provenance,
          audit: buildGuardedAuditEnvelope({
            auditTag: parsed.auditTag,
            writeReason: parsed.write_reason,
            request: parsed,
          }),
          stageDoc: shapeStageDoc(payload.entity, payload.entitySha),
        });
      }

      case "exp_rollout_status": {
        const parsed = expRolloutStatusSchema.parse(args);
        const rolloutState =
          parsed.activeRolloutPercent > parsed.plannedRolloutPercent ? "drifted" : "in-range";

        return jsonResult({
          schemaVersion: "exp.rollout-status.v1",
          business: parsed.business,
          runId: parsed.runId,
          experimentId: parsed.experimentId,
          rollout: {
            plannedPercent: parsed.plannedRolloutPercent,
            activePercent: parsed.activeRolloutPercent,
            assignmentCount: parsed.assignmentCount,
            state: rolloutState,
          },
          audit: {
            auditTag: "exp:rollout:status",
            requestedBy: parsed.requestedBy,
            generatedAt: new Date().toISOString(),
          },
        });
      }

      case "exp_results_snapshot": {
        const parsed = expResultsSnapshotSchema.parse(args);
        const controlRate = safeRate(parsed.control.conversions, parsed.control.exposures);
        const treatmentRate = safeRate(parsed.treatment.conversions, parsed.treatment.exposures);
        const absoluteLift = treatmentRate - controlRate;
        const relativeLift = controlRate > 0 ? absoluteLift / controlRate : 0;
        const minimumExposure = Math.min(parsed.control.exposures, parsed.treatment.exposures);
        const quality =
          minimumExposure === 0 ? "blocked" : minimumExposure < 200 ? "partial" : "ok";

        return jsonResult({
          schemaVersion: "exp.results-snapshot.v1",
          business: parsed.business,
          runId: parsed.runId,
          experimentId: parsed.experimentId,
          quality,
          qualityNotes:
            quality === "ok"
              ? []
              : quality === "partial"
                ? ["limited-sample-size"]
                : ["no-exposure-data"],
          results: {
            control: {
              exposures: parsed.control.exposures,
              conversions: parsed.control.conversions,
              conversionRate: controlRate,
              revenue: parsed.control.revenue,
            },
            treatment: {
              exposures: parsed.treatment.exposures,
              conversions: parsed.treatment.conversions,
              conversionRate: treatmentRate,
              revenue: parsed.treatment.revenue,
            },
            effect: {
              absoluteLift,
              relativeLift,
              revenueDelta: parsed.treatment.revenue - parsed.control.revenue,
            },
          },
        });
      }

      case "ops_update_price_guarded": {
        const parsed = opsUpdatePriceGuardedSchema.parse(args);
        const payload = await patchBosStageDoc({
          cardId: parsed.cardId,
          stage: parsed.stage,
          baseEntitySha: parsed.baseEntitySha,
          patch: {
            opsRuntime: {
              schemaVersion: "ops.update-price.v1",
              ...parsed.operation,
              writeReason: parsed.write_reason,
              auditTag: parsed.auditTag,
              provenance: parsed.provenance,
            },
          },
        });

        return jsonResult({
          schemaVersion: "ops.update-price.result.v1",
          business: parsed.business,
          runId: parsed.runId,
          cardId: parsed.cardId,
          stage: parsed.stage,
          operation: parsed.operation,
          provenance: parsed.provenance,
          audit: buildGuardedAuditEnvelope({
            auditTag: parsed.auditTag,
            writeReason: parsed.write_reason,
            request: parsed,
          }),
          stageDoc: shapeStageDoc(payload.entity, payload.entitySha),
        });
      }

      default:
        return toolError("NOT_FOUND", `Unknown BOS tool: ${name}`, false);
    }
  } catch (error) {
    return mapBosError(error);
  }
}
