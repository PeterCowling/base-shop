import { describe, expect, it } from "@jest/globals";

import {
  buildPilotClassificationRows,
  migrateRegistryV1ToV2,
  type RegistryV1ArtifactEntry,
  renderRegistryMigrationReportMarkdown,
  type StandingRegistryV1,
} from "../lp-do-ideas-registry-migrate-v1-v2.js";

function buildRegistryV1(artifacts: RegistryV1ArtifactEntry[]): StandingRegistryV1 {
  return {
    registry_version: "registry.v1",
    trigger_threshold: "T1-conservative",
    t1_semantic_sections: ["icp", "pricing"],
    updated_at: "2026-02-25T00:00:00.000Z",
    artifacts,
  };
}

describe("migrateRegistryV1ToV2", () => {
  it("TC-03-01: known v1 entries migrate to valid v2 shape", () => {
    const input = buildRegistryV1([
      {
        artifact_id: "HBAG-MARKET-PACK",
        path: "docs/business-os/strategy/HBAG/market-pack.user.md",
        domain: "MARKET",
        business: "HBAG",
        active: true,
      },
      {
        artifact_id: "HBAG-STRATEGY-INSIGHT_LOG",
        path: "docs/business-os/strategy/HBAG/insight-log.user.md",
        domain: "STRATEGY",
        business: "HBAG",
        active: true,
      },
      {
        artifact_id: "HBAG-BOS-QUEUE_STATE",
        path: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
        domain: "BOS",
        business: "HBAG",
        active: true,
      },
    ]);

    const result = migrateRegistryV1ToV2(input);
    expect(result.ok).toBe(true);
    expect(result.registry.registry_version).toBe("registry.v2");
    expect(result.registry.unknown_artifact_policy).toBe(
      "fail_closed_never_trigger",
    );
    expect(result.registry.artifacts).toHaveLength(3);
    expect(result.report.counts.classified).toBe(3);

    for (const artifact of result.registry.artifacts) {
      expect(artifact.artifact_class).toBeDefined();
      expect(artifact.trigger_policy).toBeDefined();
      expect(artifact.propagation_mode).toBeDefined();
      expect(Array.isArray(artifact.depends_on)).toBe(true);
      expect(Array.isArray(artifact.produces)).toBe(true);
    }
  });

  it("TC-03-02: unknown entries are flagged and fail-closed", () => {
    const input = buildRegistryV1([
      {
        artifact_id: "HBAG-STRATEGY-MYSTERY",
        path: "docs/business-os/strategy/HBAG/mystery-notes.txt",
        domain: "STRATEGY",
        business: "HBAG",
        active: true,
      },
    ]);

    const result = migrateRegistryV1ToV2(input);
    expect(result.ok).toBe(true);
    expect(result.report.counts.unknown).toBe(1);
    expect(result.report.unknown_artifact_ids).toContain(
      "HBAG-STRATEGY-MYSTERY",
    );

    const migrated = result.registry.artifacts[0];
    expect(migrated.artifact_class).toBe("execution_output");
    expect(migrated.trigger_policy).toBe("never");
    expect(migrated.propagation_mode).toBe("projection_auto");
  });

  it("TC-03-03: aggregate packs map to cutover-safe defaults", () => {
    const input = buildRegistryV1([
      {
        artifact_id: "HBAG-MARKET-PACK",
        path: "docs/business-os/strategy/HBAG/market-pack.user.md",
        domain: "MARKET",
        business: "HBAG",
        active: true,
      },
      {
        artifact_id: "HBAG-SELL-PACK",
        path: "docs/business-os/strategy/HBAG/sell-pack.user.md",
        domain: "SELL",
        business: "HBAG",
        active: true,
      },
      {
        artifact_id: "HBAG-PRODUCTS-PACK",
        path: "docs/business-os/strategy/HBAG/product-pack.user.md",
        domain: "PRODUCTS",
        business: "HBAG",
        active: true,
      },
      {
        artifact_id: "HBAG-LOGISTICS-PACK",
        path: "docs/business-os/strategy/HBAG/logistics-pack.user.md",
        domain: "LOGISTICS",
        business: "HBAG",
        active: true,
      },
    ]);

    const result = migrateRegistryV1ToV2(input);
    expect(result.ok).toBe(true);

    for (const artifact of result.registry.artifacts) {
      expect(artifact.artifact_class).toBe("projection_summary");
      expect(artifact.trigger_policy).toBe("manual_override_only");
      expect(artifact.propagation_mode).toBe("projection_auto");
    }
  });

  it("TC-03-04: pilot rows include pack + source scope with no unknown eligible rows", () => {
    const pilotRows = buildPilotClassificationRows("HBAG");

    expect(pilotRows.map((row) => row.artifact_id)).toEqual(
      expect.arrayContaining([
        "HBAG-MARKET-PACK",
        "HBAG-SELL-PACK",
        "HBAG-PRODUCTS-PACK",
        "HBAG-LOGISTICS-PACK",
      ]),
    );

    const eligibleRows = pilotRows.filter(
      (row) => row.trigger_policy === "eligible",
    );
    expect(eligibleRows.length).toBeGreaterThan(0);
    expect(
      eligibleRows.every((row) => row.classification_status !== "unknown"),
    ).toBe(true);
  });
});

describe("renderRegistryMigrationReportMarkdown", () => {
  it("renders classified/inferred/unknown/blocked count section", () => {
    const result = migrateRegistryV1ToV2(
      buildRegistryV1([
        {
          artifact_id: "HBAG-MARKET-PACK",
          path: "docs/business-os/strategy/HBAG/market-pack.user.md",
          domain: "MARKET",
          business: "HBAG",
          active: true,
        },
      ]),
    );
    const markdown = renderRegistryMigrationReportMarkdown(result);

    expect(markdown).toContain("## Counts");
    expect(markdown).toContain("Classified:");
    expect(markdown).toContain("Inferred:");
    expect(markdown).toContain("Unknown:");
    expect(markdown).toContain("Blocked:");
  });
});
