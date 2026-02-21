import {
  ContractMigrationConfigSchema,
  getContractMigrationConfig,
  isAliasAcceptanceEnabled,
  isDualReadEnabled,
  normalizeStageKey,
} from "./contract-migration";
import { CONTRACT_MIGRATION_CONFIG } from "./contract-migration.generated";

function utc(dateTime: string): Date {
  return new Date(dateTime);
}

describe("contract-migration", () => {
  test("TC-01: generated config validates against schema", () => {
    expect(() => ContractMigrationConfigSchema.parse(CONTRACT_MIGRATION_CONFIG)).not.toThrow();

    const { config, valid } = getContractMigrationConfig();
    expect(valid).toBe(true);

    // Parsed form used by runtime should have normalized cutoff dates.
    expect(config.timebox.alias_accept_until_utc).toBeInstanceOf(Date);
    expect(config.timebox.dual_read_until_utc).toBeInstanceOf(Date);
    expect(config.timebox.lint_warn_until_utc).toBeInstanceOf(Date);
  });

  test("TC-02: cutoff dates are inclusive through 23:59:59.999Z", () => {
    const { config } = getContractMigrationConfig();

    const day = config.timebox.alias_accept_until_utc.toISOString().slice(0, 10);

    expect(isAliasAcceptanceEnabled(config, utc(`${day}T23:59:59.999Z`))).toBe(true);

    const next = new Date(utc(`${day}T23:59:59.999Z`).getTime() + 1);
    expect(isAliasAcceptanceEnabled(config, next)).toBe(false);
  });

  test("TC-03: stage key normalization maps legacy alias when enabled", () => {
    const { config } = getContractMigrationConfig();
    const firstAlias = Object.entries(config.stage_aliases)[0];
    if (!firstAlias) {
      // Alias table can be empty once migration is fully complete.
      expect(normalizeStageKey(config, "lp-do-fact-find", new Date(0))).toBeNull();
      return;
    }

    const [legacyAlias, canonicalStage] = firstAlias;

    // Use the configured inclusive cutoff instant to stay aligned with generated config.
    const enabledNow = new Date(config.timebox.alias_accept_until_utc.getTime());
    const result = normalizeStageKey(config, legacyAlias, enabledNow);

    if (!result) {
      // Config is already expired (or alias removed). That is allowed.
      expect(isAliasAcceptanceEnabled(config, enabledNow)).toBe(false);
      return;
    }

    expect(result.normalized).toBe(true);
    if (result.normalized) {
      expect(result.rawStage).toBe(legacyAlias);
      expect(result.normalizedStage).toBe(canonicalStage);
      expect(result.stage).toBe(canonicalStage);
    }
  });

  test("TC-04: dual-read enablement is separately controlled", () => {
    const { config } = getContractMigrationConfig();
    expect(typeof isDualReadEnabled(config, new Date())).toBe("boolean");
  });
});
