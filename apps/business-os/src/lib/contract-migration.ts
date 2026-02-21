import { z } from "zod";

import { StageTypeSchema } from "@acme/platform-core/repositories/businessOs.server";

import { CONTRACT_MIGRATION_CONFIG } from "./contract-migration.generated";

const CutoffDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
  .transform((value) => {
    // Inclusive cutoff: through 23:59:59.999Z of the given date.
    const [y, m, d] = value.split("-").map((n) => Number(n));
    const dt = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
    if (Number.isNaN(dt.getTime())) {
      throw new Error("Invalid UTC date");
    }
    return dt;
  });

export const ContractMigrationConfigSchema = z.object({
  version: z.literal("1"),
  timebox: z.object({
    alias_accept_until_utc: CutoffDateSchema,
    dual_read_until_utc: CutoffDateSchema,
    lint_warn_until_utc: CutoffDateSchema,
  }),
  stage_aliases: z.record(z.string(), StageTypeSchema),
  filename_aliases: z.record(z.string(), z.string()),
  allowlists: z.object({
    legacy_filename_refs: z.array(z.string()),
    legacy_stage_key_emitters: z.array(z.string()),
  }),
});

export type ContractMigrationConfig = z.infer<typeof ContractMigrationConfigSchema>;

export type StageAliasResult =
  | { normalized: false; stage: z.infer<typeof StageTypeSchema> }
  | {
      normalized: true;
      stage: z.infer<typeof StageTypeSchema>;
      rawStage: string;
      normalizedStage: z.infer<typeof StageTypeSchema>;
    };

function shouldEnableLegacyBehavior(
  nowUtc: Date,
  cutoffInclusiveUtc: Date
): boolean {
  return nowUtc.getTime() <= cutoffInclusiveUtc.getTime();
}

function getNowUtc(): Date {
  // Date is always UTC internally; this is a semantic helper.
  return new Date();
}

export function getContractMigrationConfig(): {
  config: ContractMigrationConfig;
  valid: boolean;
} {
  const parsed = ContractMigrationConfigSchema.safeParse(CONTRACT_MIGRATION_CONFIG);
  if (!parsed.success) {
    // Fail-closed for legacy behavior only.
    // Canonical stage-doc operations must continue without migration behavior.
    const disabledLegacy = ContractMigrationConfigSchema.parse({
      version: "1",
      timebox: {
        alias_accept_until_utc: "1970-01-01",
        dual_read_until_utc: "1970-01-01",
        lint_warn_until_utc: "1970-01-01",
      },
      stage_aliases: {},
      filename_aliases: {},
      allowlists: {
        legacy_filename_refs: [],
        legacy_stage_key_emitters: [],
      },
    });

    return { config: disabledLegacy, valid: false };
  }

  return { config: parsed.data, valid: true };
}

export function isAliasAcceptanceEnabled(
  cfg: ContractMigrationConfig,
  nowUtc: Date = getNowUtc()
): boolean {
  return shouldEnableLegacyBehavior(nowUtc, cfg.timebox.alias_accept_until_utc);
}

export function isDualReadEnabled(
  cfg: ContractMigrationConfig,
  nowUtc: Date = getNowUtc()
): boolean {
  return shouldEnableLegacyBehavior(nowUtc, cfg.timebox.dual_read_until_utc);
}

export function isLintWarnPhase(
  cfg: ContractMigrationConfig,
  nowUtc: Date = getNowUtc()
): boolean {
  return shouldEnableLegacyBehavior(nowUtc, cfg.timebox.lint_warn_until_utc);
}

export function normalizeStageKey(
  cfg: ContractMigrationConfig,
  rawStage: string,
  nowUtc: Date = getNowUtc()
): StageAliasResult | null {
  const canonical = StageTypeSchema.safeParse(rawStage);
  if (canonical.success) {
    return { normalized: false, stage: canonical.data };
  }

  if (!isAliasAcceptanceEnabled(cfg, nowUtc)) {
    return null;
  }

  const mapped = cfg.stage_aliases[rawStage];
  if (!mapped) return null;

  return {
    normalized: true,
    stage: mapped,
    rawStage,
    normalizedStage: mapped,
  };
}
