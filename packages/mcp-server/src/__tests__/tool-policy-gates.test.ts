/** @jest-environment node */

import {
  getPolicyMode,
  parsePolicyMap,
  preflightToolCallPolicy,
  preflightWave2Envelope,
  redactSensitiveFields,
} from "../tools/policy";

describe("tool policy gates", () => {
  it("TC-01: strict-scope tool without metadata fails closed", () => {
    const result = preflightToolCallPolicy({
      toolName: "bos_cards_list",
      args: {
        business: "BRIK",
        cardId: "BRIK-ENG-0001",
        runId: "2026-02-13-run-01",
        current_stage: "S5B",
      },
      knownToolNames: new Set(["bos_cards_list"]),
      policyMap: parsePolicyMap({}),
    });

    expect(result?.isError).toBe(true);
    const payload = JSON.parse(result?.content[0]?.text ?? "{}");
    expect(payload.error.code).toBe("CONTRACT_MISMATCH");
    expect(payload.error.details.enforcementScope).toBe("startup_loop_only");
  });

  it("TC-02: strict-scope tool rejects forbidden stage", () => {
    const policyMap = parsePolicyMap({
      bos_stage_doc_get: {
        permission: "read",
        sideEffects: "none",
        allowedStages: ["S7"],
        auditTag: "bos:stage-doc:get",
        contextRequired: ["business", "cardId", "runId"],
        sensitiveFields: ["baseEntitySha"],
      },
    });

    const result = preflightToolCallPolicy({
      toolName: "bos_stage_doc_get",
      args: {
        business: "BRIK",
        cardId: "BRIK-ENG-0001",
        runId: "2026-02-13-run-01",
        current_stage: "S5B",
      },
      knownToolNames: new Set(["bos_stage_doc_get"]),
      policyMap,
    });

    expect(result?.isError).toBe(true);
    const payload = JSON.parse(result?.content[0]?.text ?? "{}");
    expect(payload.error.code).toBe("FORBIDDEN_STAGE");
    expect(payload.error.message).toContain("bos_stage_doc_get");
    expect(payload.error.message).toContain("S5B");
  });

  it("TC-03: strict read tool with valid context passes preflight", () => {
    const policyMap = parsePolicyMap({
      bos_stage_doc_get: {
        permission: "read",
        sideEffects: "none",
        allowedStages: ["S5B", "S7", "S8"],
        auditTag: "bos:stage-doc:get",
        contextRequired: ["business", "cardId", "runId"],
        sensitiveFields: ["baseEntitySha"],
      },
    });

    const result = preflightToolCallPolicy({
      toolName: "bos_stage_doc_get",
      args: {
        business: "BRIK",
        cardId: "BRIK-ENG-0001",
        runId: "2026-02-13-run-01",
        current_stage: "S7",
      },
      knownToolNames: new Set(["bos_stage_doc_get"]),
      policyMap,
    });

    expect(result).toBeNull();
  });

  it("TC-04: strict guarded_write tool requires write_reason and baseEntitySha", () => {
    const policyMap = parsePolicyMap({
      bos_stage_doc_patch_guarded: {
        permission: "guarded_write",
        sideEffects: "bos_write",
        allowedStages: ["S5B", "S7", "S8", "S9"],
        auditTag: "bos:stage-doc:patch",
        contextRequired: ["business", "cardId", "runId"],
        requiresEntitySha: true,
        sensitiveFields: ["baseEntitySha"],
      },
    });

    const missingReason = preflightToolCallPolicy({
      toolName: "bos_stage_doc_patch_guarded",
      args: {
        business: "BRIK",
        cardId: "BRIK-ENG-0001",
        runId: "2026-02-13-run-01",
        current_stage: "S5B",
        baseEntitySha: "abc123",
      },
      knownToolNames: new Set(["bos_stage_doc_patch_guarded"]),
      policyMap,
    });

    const missingSha = preflightToolCallPolicy({
      toolName: "bos_stage_doc_patch_guarded",
      args: {
        business: "BRIK",
        cardId: "BRIK-ENG-0001",
        runId: "2026-02-13-run-01",
        current_stage: "S5B",
        write_reason: "sync plan to stage doc",
      },
      knownToolNames: new Set(["bos_stage_doc_patch_guarded"]),
      policyMap,
    });

    const reasonPayload = JSON.parse(missingReason?.content[0]?.text ?? "{}");
    const shaPayload = JSON.parse(missingSha?.content[0]?.text ?? "{}");
    expect(reasonPayload.error.code).toBe("CONTRACT_MISMATCH");
    expect(shaPayload.error.code).toBe("CONTRACT_MISMATCH");
    expect(reasonPayload.error.message).toContain("bos_stage_doc_patch_guarded");
    expect(shaPayload.error.message).toContain("bos_stage_doc_patch_guarded");
  });

  it("TC-05: legacy compatibility mode warns once and redacts sensitive args", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const result = preflightToolCallPolicy({
      toolName: "shop_get",
      args: {
        shopId: "shop",
        apiKey: "top-secret",
        nested: {
          token: "nested-token",
        },
      },
      knownToolNames: new Set(["shop_get"]),
      policyMap: parsePolicyMap({}),
    });

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);

    const warningPayload = warnSpy.mock.calls[0]?.[1] as string;
    expect(warningPayload).toContain("legacy_compat");
    expect(warningPayload).toContain("[REDACTED]");

    warnSpy.mockRestore();
  });

  it("TC-06: policy schema rejects unknown permission enum", () => {
    expect(() =>
      parsePolicyMap({
        bos_stage_doc_get: {
          permission: "legacy",
          sideEffects: "none",
          allowedStages: ["S7"],
          auditTag: "bos:stage-doc:get",
          contextRequired: ["business", "cardId", "runId"],
          sensitiveFields: ["baseEntitySha"],
        },
      })
    ).toThrow();
  });

  it("TC-07: getPolicyMode distinguishes strict, compatibility, and unknown", () => {
    const policyMap = parsePolicyMap({
      bos_stage_doc_get: {
        permission: "read",
        sideEffects: "none",
        allowedStages: ["S7"],
        auditTag: "bos:stage-doc:get",
        contextRequired: ["business", "cardId", "runId"],
        sensitiveFields: [],
      },
    });

    const knownToolNames = new Set(["bos_stage_doc_get", "shop_get"]);

    expect(getPolicyMode("bos_stage_doc_get", knownToolNames, policyMap)).toBe("strict");
    expect(getPolicyMode("shop_get", knownToolNames, policyMap)).toBe("legacy_compat");
    expect(getPolicyMode("random_tool", knownToolNames, policyMap)).toBe("unknown");
  });

  it("TC-08: redactSensitiveFields masks configured keys recursively", () => {
    const input = {
      write_reason: "sync",
      baseEntitySha: "abc123",
      nested: {
        apiKey: "secret",
      },
    };

    const redacted = redactSensitiveFields(input, ["write_reason"]);
    expect(redacted).toEqual({
      write_reason: "[REDACTED]",
      baseEntitySha: "[REDACTED]",
      nested: {
        apiKey: "[REDACTED]",
      },
    });
  });

  it("TC-09: wave-2 envelope middleware fails closed on missing provenance keys", () => {
    const result = preflightWave2Envelope({
      schemaVersion: "measure.snapshot.v1",
      refreshedAt: "2026-02-13T10:00:00Z",
      quality: "ok",
      qualityNotes: [],
      coverage: {
        expectedPoints: 7,
        observedPoints: 7,
        samplingFraction: 1,
      },
      provenance: {
        schemaVersion: "provenance.v1",
        generatedAt: "2026-02-13T10:00:00Z",
        datasetId: "ds1",
        sourceRef: "stripe/revenue",
        artifactRefs: ["artifact://collectors/stripe/revenue-2026-02-13.json"],
        quality: "ok",
      },
    });

    expect(result?.isError).toBe(true);
    const payload = JSON.parse(result?.content[0]?.text ?? "{}");
    expect(payload.error.code).toBe("CONTRACT_MISMATCH");
    expect(String(payload.error.message)).toContain("Wave-2 envelope");
  });
});
