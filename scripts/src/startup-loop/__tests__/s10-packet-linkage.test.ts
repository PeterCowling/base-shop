/**
 * S10 Weekly Packet Linkage — Compatibility Regression Checks
 *
 * TC-06-03: Artifact continuity — weekly packet schema states canonical artifacts
 *           are referenced and not replaced
 * TC-06-04: Rerun idempotency — week-key rerun policy is deterministic and testable
 *           via explicit schema text assertions
 *
 * TASK-06: startup-loop-s10-weekly-orchestration plan
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { describe, expect, it } from "@jest/globals";

const REPO_ROOT = path.resolve(__dirname, "../../../../");

const SCHEMA_PATH = path.join(
  REPO_ROOT,
  "docs/business-os/startup-loop/s10-weekly-packet-schema-v1.md"
);

// ── TC-06-03: Artifact continuity ────────────────────────────────────────────

describe("TC-06-03: artifact continuity (s10-weekly-packet-schema-v1.md)", () => {
  it("packet schema file is readable", () => {
    expect(() => fs.readFileSync(SCHEMA_PATH, "utf8")).not.toThrow();
  });

  it("schema states canonical artifacts are retained (not replaced)", () => {
    const raw = fs.readFileSync(SCHEMA_PATH, "utf8");
    // The schema must explicitly state the additive/retain policy
    expect(raw).toContain("never replaces");
  });

  it("schema includes canonical weekly KPCS decision path pattern", () => {
    const raw = fs.readFileSync(SCHEMA_PATH, "utf8");
    // The canonical KPCS decision artifact path pattern must be present
    expect(raw).toContain("weekly-kpcs-decision");
  });

  it("schema includes canonical signal review artifact path pattern", () => {
    const raw = fs.readFileSync(SCHEMA_PATH, "utf8");
    expect(raw).toContain("signal-review");
  });

  it("schema includes kpcs_decision_ref field (packet links to canonical artifact)", () => {
    const raw = fs.readFileSync(SCHEMA_PATH, "utf8");
    expect(raw).toContain("kpcs_decision_ref");
  });

  it("schema includes signal_review_ref field (packet links to signal review)", () => {
    const raw = fs.readFileSync(SCHEMA_PATH, "utf8");
    expect(raw).toContain("signal_review_ref");
  });

  it("schema includes feedback_audit_ref field (packet links to feedback audit)", () => {
    const raw = fs.readFileSync(SCHEMA_PATH, "utf8");
    expect(raw).toContain("feedback_audit_ref");
  });

  it("schema cross-references the orchestration contract (authority chain intact)", () => {
    const raw = fs.readFileSync(SCHEMA_PATH, "utf8");
    expect(raw).toContain("s10-weekly-orchestration-contract-v1.md");
  });
});

// ── TC-06-04: Rerun idempotency ──────────────────────────────────────────────

describe("TC-06-04: rerun idempotency (s10-weekly-packet-schema-v1.md)", () => {
  it("schema contains YYYY-Www week key format (anchor for idempotency)", () => {
    const raw = fs.readFileSync(SCHEMA_PATH, "utf8");
    expect(raw).toContain("YYYY-Www");
  });

  it("schema states overwrite-in-place behavior per week key", () => {
    const raw = fs.readFileSync(SCHEMA_PATH, "utf8");
    // The idempotency rule must specify in-place overwrite semantics
    expect(raw).toContain("overwrites the existing weekly packet in place");
  });

  it("schema prohibits version-suffix copies on rerun", () => {
    const raw = fs.readFileSync(SCHEMA_PATH, "utf8");
    // Must explicitly state no version-suffix copies
    expect(raw).toContain("does not create a new packet file with a version suffix");
  });

  it("schema states pointer is only updated on successful publish (fail-safe)", () => {
    const raw = fs.readFileSync(SCHEMA_PATH, "utf8");
    // Pointer update rule must be conditional on success
    expect(raw).toContain("never updated on a failed publish");
  });

  it("schema requires week_key field (idempotency key is mandatory)", () => {
    const raw = fs.readFileSync(SCHEMA_PATH, "utf8");
    expect(raw).toContain("week_key");
    // fail-closed behavior must be documented
    expect(raw).toContain("fail-closed");
  });

  it("schema includes the latest-pointer path (deterministic lookup)", () => {
    const raw = fs.readFileSync(SCHEMA_PATH, "utf8");
    expect(raw).toContain("s10-weekly-packet-latest.md");
  });
});
