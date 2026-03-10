import { createHash } from "node:crypto";
import * as fs from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import type { MetaObservation } from "../self-evolving/self-evolving-contracts.js";
import {
  buildWriteBackProposals,
  runWriteBackProposalBridge,
  type WriteBackProposalRuleSet,
} from "../self-evolving/self-evolving-write-back-proposals.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(path.join(tmpdir(), "write-back-proposals-test-"));
});

afterEach(() => {
  if (tmpDir) {
    rmSync(tmpDir, { force: true, recursive: true });
  }
});

function makeObservation(
  overrides?: Partial<MetaObservation>,
): MetaObservation {
  const hasOverride = <K extends keyof MetaObservation>(key: K): boolean =>
    Object.prototype.hasOwnProperty.call(overrides ?? {}, key);

  return {
    schema_version: hasOverride("schema_version")
      ? (overrides?.schema_version as string)
      : "meta-observation.v2",
    observation_id: overrides?.observation_id ?? "obs-1",
    observation_type: overrides?.observation_type ?? "metric_regression",
    timestamp: overrides?.timestamp ?? "2026-03-09T10:00:00.000Z",
    business: overrides?.business ?? "TEST",
    actor_type: overrides?.actor_type ?? "automation",
    run_id: overrides?.run_id ?? "run-test",
    session_id: overrides?.session_id ?? "session-test",
    skill_id: overrides?.skill_id ?? "lp-do-build",
    container_id: overrides?.container_id ?? null,
    artifact_refs: overrides?.artifact_refs ?? ["docs/source.md"],
    context_path: overrides?.context_path ?? "test/context",
    hard_signature: overrides?.hard_signature ?? "signature",
    soft_cluster_id: overrides?.soft_cluster_id ?? null,
    fingerprint_version: overrides?.fingerprint_version ?? "1",
    repeat_count_window: overrides?.repeat_count_window ?? 1,
    operator_minutes_estimate: overrides?.operator_minutes_estimate ?? 5,
    quality_impact_estimate: overrides?.quality_impact_estimate ?? 0.4,
    detector_confidence: overrides?.detector_confidence ?? 0.8,
    severity: overrides?.severity ?? 0.5,
    inputs_hash: overrides?.inputs_hash ?? "inputs",
    outputs_hash: overrides?.outputs_hash ?? "outputs",
    toolchain_version: overrides?.toolchain_version ?? "test",
    model_version: overrides?.model_version ?? null,
    kpi_name: overrides?.kpi_name ?? "activation_rate",
    kpi_value: overrides?.kpi_value ?? 0.27,
    kpi_unit: overrides?.kpi_unit ?? "ratio",
    aggregation_method: overrides?.aggregation_method ?? "rate",
    sample_size: overrides?.sample_size ?? 120,
    data_quality_status: overrides?.data_quality_status ?? "ok",
    data_quality_reason_code: overrides?.data_quality_reason_code ?? null,
    baseline_ref: overrides?.baseline_ref ?? "baseline",
    measurement_window: overrides?.measurement_window ?? "7d",
    traffic_segment: overrides?.traffic_segment ?? "all",
    evidence_refs: overrides?.evidence_refs ?? ["docs/evidence.md"],
    evidence_grade: hasOverride("evidence_grade")
      ? (overrides?.evidence_grade ?? null)
      : "measured",
    measurement_contract_status: hasOverride("measurement_contract_status")
      ? (overrides?.measurement_contract_status ?? null)
      : "verified",
    signal_hints: overrides?.signal_hints,
  };
}

function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

function writeObservations(filePath: string, observations: MetaObservation[]): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    `${observations.map((observation) => JSON.stringify(observation)).join("\n")}\n`,
    "utf-8",
  );
}

function writeRegistryArtifact(
  filePath: string,
  artifactRelPath: string,
  artifactId = "TEST-METRIC",
): void {
  writeJson(filePath, {
    registry_version: "registry.v2",
    t1_semantic_sections: [],
    artifacts: [
      {
        artifact_id: artifactId,
        path: artifactRelPath,
        domain: "TEST",
        business: "TEST",
        trigger_policy: "eligible",
        propagation_mode: "source_task",
        last_known_sha: null,
        active: true,
      },
    ],
  });
}

function sha(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex");
}

describe("buildWriteBackProposals", () => {
  it("compiles a mapped KPI observation into ProposedUpdate output", () => {
    const ruleSet: WriteBackProposalRuleSet = {
      schema_version: "write-back-rule-set.v1",
      business: "TEST",
      updated_at: "2026-03-09T00:00:00.000Z",
      rules: [
        {
          rule_id: "rule-activation",
          kpi_name: "activation_rate",
          artifact_id: "TEST-METRIC",
          json_field: "metrics.activationRate",
          content_template: "{{kpi_value}}",
        },
      ],
    };

    const result = buildWriteBackProposals({
      observations: [makeObservation()],
      ruleSet,
    });

    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0]).toEqual({
      artifact_id: "TEST-METRIC",
      json_field: "metrics.activationRate",
      frontmatter_field: undefined,
      section_heading: undefined,
      new_content: "0.27",
      evidence_refs: [
        "self-evolving-observation:obs-1",
        "docs/evidence.md",
        "docs/source.md",
      ],
    });
  });

  it("skips observations below the minimum sample size", () => {
    const ruleSet: WriteBackProposalRuleSet = {
      schema_version: "write-back-rule-set.v1",
      business: "TEST",
      updated_at: "2026-03-09T00:00:00.000Z",
      rules: [
        {
          rule_id: "rule-activation",
          kpi_name: "activation_rate",
          artifact_id: "TEST-METRIC",
          json_field: "metrics.activationRate",
          content_template: "{{kpi_value}}",
          minimum_sample_size: 200,
        },
      ],
    };

    const result = buildWriteBackProposals({
      observations: [makeObservation()],
      ruleSet,
    });

    expect(result.proposals).toHaveLength(0);
    expect(result.skipped_counts["sample_size_below_threshold"]).toBe(1);
  });

  it("rejects exploratory and structural observations from write-back eligibility", () => {
    const ruleSet: WriteBackProposalRuleSet = {
      schema_version: "write-back-rule-set.v1",
      business: "TEST",
      updated_at: "2026-03-09T00:00:00.000Z",
      rules: [
        {
          rule_id: "rule-activation",
          kpi_name: "activation_rate",
          artifact_id: "TEST-METRIC",
          json_field: "metrics.activationRate",
          content_template: "{{kpi_value}}",
        },
      ],
    };

    const result = buildWriteBackProposals({
      observations: [
        makeObservation({
          observation_id: "obs-exploratory",
          evidence_grade: "exploratory",
          measurement_contract_status: "none",
        }),
        makeObservation({
          observation_id: "obs-structural",
          baseline_ref: null,
          evidence_grade: "structural",
          measurement_contract_status: "declared",
        }),
      ],
      ruleSet,
    });

    expect(result.proposals).toHaveLength(0);
    expect(result.skipped_counts["write_back_requires_measured_posture"]).toBe(2);
  });

  it("rejects legacy unlabeled observations even if KPI fields are present", () => {
    const ruleSet: WriteBackProposalRuleSet = {
      schema_version: "write-back-rule-set.v1",
      business: "TEST",
      updated_at: "2026-03-09T00:00:00.000Z",
      rules: [
        {
          rule_id: "rule-activation",
          kpi_name: "activation_rate",
          artifact_id: "TEST-METRIC",
          json_field: "metrics.activationRate",
          content_template: "{{kpi_value}}",
        },
      ],
    };

    const result = buildWriteBackProposals({
      observations: [
        makeObservation({
          schema_version: "meta-observation.v1",
          evidence_grade: undefined,
          measurement_contract_status: undefined,
        }),
      ],
      ruleSet,
    });

    expect(result.proposals).toHaveLength(0);
    expect(result.skipped_counts["write_back_requires_measured_posture"]).toBe(1);
  });

  it("keeps only the latest qualifying observation per target key", () => {
    const ruleSet: WriteBackProposalRuleSet = {
      schema_version: "write-back-rule-set.v1",
      business: "TEST",
      updated_at: "2026-03-09T00:00:00.000Z",
      rules: [
        {
          rule_id: "rule-activation",
          kpi_name: "activation_rate",
          artifact_id: "TEST-METRIC",
          json_field: "metrics.activationRate",
          content_template: "{{kpi_value}}",
        },
      ],
    };

    const older = makeObservation({
      observation_id: "obs-old",
      timestamp: "2026-03-09T09:00:00.000Z",
      kpi_value: 0.2,
    });
    const newer = makeObservation({
      observation_id: "obs-new",
      timestamp: "2026-03-09T11:00:00.000Z",
      kpi_value: 0.33,
    });

    const result = buildWriteBackProposals({
      observations: [older, newer],
      ruleSet,
    });

    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0]?.new_content).toBe("0.33");
    expect(result.compiled[0]?.observation_id).toBe("obs-new");
  });
});

describe("runWriteBackProposalBridge", () => {
  it("writes proposal output without applying by default", () => {
    const observationsPath = path.join(
      tmpDir,
      "docs/business-os/startup-loop/self-evolving/TEST/observations.jsonl",
    );
    const rulesPath = path.join(
      tmpDir,
      "docs/business-os/startup-loop/self-evolving/TEST/write-back-mappings.json",
    );
    const outputPath = path.join(
      tmpDir,
      "docs/business-os/startup-loop/self-evolving/TEST/write-back-proposals.json",
    );

    writeObservations(observationsPath, [makeObservation()]);
    writeJson(rulesPath, {
      schema_version: "write-back-rule-set.v1",
      business: "TEST",
      updated_at: "2026-03-09T00:00:00.000Z",
      rules: [
        {
          rule_id: "rule-activation",
          kpi_name: "activation_rate",
          artifact_id: "TEST-METRIC",
          json_field: "metrics.activationRate",
          content_template: "{{kpi_value}}",
        },
      ],
    });

    const result = runWriteBackProposalBridge({
      business: "TEST",
      rootDir: tmpDir,
      rulesFile: path.relative(tmpDir, rulesPath),
      outputFile: path.relative(tmpDir, outputPath),
      observationsPath: path.relative(tmpDir, observationsPath),
      registryPath: "docs/business-os/startup-loop/ideas/standing-registry.json",
      apply: false,
      dryRun: false,
    });

    const written = JSON.parse(fs.readFileSync(outputPath, "utf-8")) as unknown[];
    expect(result.proposals).toHaveLength(1);
    expect(result.applied).toHaveLength(0);
    expect(written).toHaveLength(1);
  });

  it("can compile and apply proposals through the existing write-back engine", () => {
    const observationsPath = path.join(
      tmpDir,
      "docs/business-os/startup-loop/self-evolving/TEST/observations.jsonl",
    );
    const rulesPath = path.join(
      tmpDir,
      "docs/business-os/startup-loop/self-evolving/TEST/write-back-mappings.json",
    );
    const outputPath = path.join(
      tmpDir,
      "docs/business-os/startup-loop/self-evolving/TEST/write-back-proposals.json",
    );
    const registryPath = path.join(
      tmpDir,
      "docs/business-os/startup-loop/ideas/standing-registry.json",
    );
    const artifactPath = path.join(tmpDir, "docs/business-os/strategy/TEST/metrics.json");
    const artifactContent = JSON.stringify(
      { metrics: { activationRate: 0.1 } },
      null,
      2,
    ) + "\n";

    writeObservations(observationsPath, [makeObservation()]);
    writeJson(rulesPath, {
      schema_version: "write-back-rule-set.v1",
      business: "TEST",
      updated_at: "2026-03-09T00:00:00.000Z",
      rules: [
        {
          rule_id: "rule-activation",
          kpi_name: "activation_rate",
          artifact_id: "TEST-METRIC",
          json_field: "metrics.activationRate",
          content_template: "{{kpi_value}}",
        },
      ],
    });

    fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
    fs.writeFileSync(artifactPath, artifactContent, "utf-8");
    writeRegistryArtifact(
      registryPath,
      path.relative(tmpDir, artifactPath),
      "TEST-METRIC",
    );

    const registry = JSON.parse(fs.readFileSync(registryPath, "utf-8")) as {
      artifacts: Array<{ last_known_sha: string | null }>;
    };
    registry.artifacts[0]!.last_known_sha = sha(artifactContent);
    fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`, "utf-8");

    const result = runWriteBackProposalBridge({
      business: "TEST",
      rootDir: tmpDir,
      rulesFile: path.relative(tmpDir, rulesPath),
      outputFile: path.relative(tmpDir, outputPath),
      observationsPath: path.relative(tmpDir, observationsPath),
      registryPath: path.relative(tmpDir, registryPath),
      apply: true,
      dryRun: false,
    });

    const updatedArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8")) as {
      metrics: { activationRate: number };
    };
    expect(result.proposals).toHaveLength(1);
    expect(result.applied).toHaveLength(1);
    expect(result.applied[0]?.outcome).toBe("applied");
    expect(updatedArtifact.metrics.activationRate).toBe(0.27);
  });
});
