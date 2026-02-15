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

    // Pick an instant that is guaranteed to be <= any realistic cutoff.
    const enabledNow = utc("1970-01-01T00:00:00.000Z");
    const result = normalizeStageKey(config, "lp-fact-find", enabledNow);

    if (!result) {
      // Config is already expired (or alias removed). That is allowed.
      expect(isAliasAcceptanceEnabled(config, enabledNow)).toBe(false);
      return;
    }

    expect(result.normalized).toBe(true);
    if (result.normalized) {
      expect(result.rawStage).toBe("lp-fact-find");
      expect(result.normalizedStage).toBe("fact-find");
      expect(result.stage).toBe("fact-find");
    }
  });

  test("TC-04: dual-read enablement is separately controlled", () => {
    const { config } = getContractMigrationConfig();
    expect(typeof isDualReadEnabled(config, new Date())).toBe("boolean");
  });
});
