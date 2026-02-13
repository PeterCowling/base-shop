/** @jest-environment node */

import { handleBosTool } from "../tools/bos";

function parsePayload(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text);
}

const sharedProvenance = {
  schemaVersion: "provenance.v1",
  querySignature: "exp-register:BRIK:EXP-001",
  generatedAt: "2026-02-13T12:00:00Z",
  datasetId: "dataset-exp-runtime-001",
  sourceRef: "bos/stage-docs",
  artifactRefs: ["artifact://startup-loop/experiments/runtime-run-001.json"],
  quality: "ok",
} as const;

describe("bos guarded write tool", () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.BOS_AGENT_API_BASE_URL;
  const originalApiKey = process.env.BOS_AGENT_API_KEY;

  beforeEach(() => {
    process.env.BOS_AGENT_API_BASE_URL = "http://localhost:3020";
    process.env.BOS_AGENT_API_KEY = "bos_test_key_1234567890";
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    process.env.BOS_AGENT_API_BASE_URL = originalBaseUrl;
    process.env.BOS_AGENT_API_KEY = originalApiKey;
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it("TC-01: valid guarded PATCH returns updated entitySha", async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        entity: {
          "Card-ID": "BRIK-ENG-0001",
          Stage: "plan",
          Updated: "2026-02-13T23:40:00Z",
          content: "# Planned\nUpdated",
        },
        entitySha: "sha-next",
      }),
    });

    const result = await handleBosTool("bos_stage_doc_patch_guarded", {
      business: "BRIK",
      cardId: "BRIK-ENG-0001",
      stage: "plan",
      runId: "run-001",
      current_stage: "S7",
      write_reason: "sync plan stage doc",
      baseEntitySha: "sha-prev",
      patch: {
        content: "# Planned\nUpdated",
      },
    });

    const payload = parsePayload(result);
    expect(result.isError).toBeUndefined();
    expect(payload.stageDoc.entitySha).toBe("sha-next");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("TC-02: stale entitySha returns CONFLICT_ENTITY_SHA with latest hint", async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      statusText: "Conflict",
      json: async () => ({
        error: "CONFLICT",
        currentEntitySha: "sha-current",
      }),
    });

    const result = await handleBosTool("bos_stage_doc_patch_guarded", {
      business: "BRIK",
      cardId: "BRIK-ENG-0001",
      stage: "plan",
      runId: "run-001",
      current_stage: "S7",
      write_reason: "sync plan stage doc",
      baseEntitySha: "sha-stale",
      patch: {
        content: "# Planned\nUpdated",
      },
    });

    const payload = parsePayload(result);
    expect(result.isError).toBe(true);
    expect(payload.error.code).toBe("CONFLICT_ENTITY_SHA");
    expect(payload.error.details.re_read_required).toBe(true);
    expect(payload.error.details.currentEntitySha).toBe("sha-current");
  });

  it("TC-03: forbidden stage rejects write before network call", async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;

    const result = await handleBosTool("bos_stage_doc_patch_guarded", {
      business: "BRIK",
      cardId: "BRIK-ENG-0001",
      stage: "plan",
      runId: "run-001",
      current_stage: "S2A",
      write_reason: "sync plan stage doc",
      baseEntitySha: "sha-prev",
      patch: {
        content: "# Planned\nUpdated",
      },
    });

    const payload = parsePayload(result);
    expect(result.isError).toBe(true);
    expect(payload.error.code).toBe("FORBIDDEN_STAGE");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("TC-04: missing write_reason fails validation before network call", async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;

    const result = await handleBosTool("bos_stage_doc_patch_guarded", {
      business: "BRIK",
      cardId: "BRIK-ENG-0001",
      stage: "plan",
      runId: "run-001",
      current_stage: "S7",
      baseEntitySha: "sha-prev",
      patch: {
        content: "# Planned\nUpdated",
      },
    });

    const payload = parsePayload(result);
    expect(result.isError).toBe(true);
    expect(payload.error.code).toBe("CONTRACT_MISMATCH");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("TC-05: upstream auth failure returns AUTH_FAILED", async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ error: "Unauthorized" }),
    });

    const result = await handleBosTool("bos_stage_doc_patch_guarded", {
      business: "BRIK",
      cardId: "BRIK-ENG-0001",
      stage: "plan",
      runId: "run-001",
      current_stage: "S7",
      write_reason: "sync plan stage doc",
      baseEntitySha: "sha-prev",
      patch: {
        content: "# Planned\nUpdated",
      },
    });

    const payload = parsePayload(result);
    expect(result.isError).toBe(true);
    expect(payload.error.code).toBe("AUTH_FAILED");
  });

  it("TC-06: conflict path does not auto-retry", async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      statusText: "Conflict",
      json: async () => ({
        error: "CONFLICT",
        currentEntitySha: "sha-current",
      }),
    });

    await handleBosTool("bos_stage_doc_patch_guarded", {
      business: "BRIK",
      cardId: "BRIK-ENG-0001",
      stage: "plan",
      runId: "run-001",
      current_stage: "S7",
      write_reason: "sync plan stage doc",
      baseEntitySha: "sha-stale",
      patch: {
        content: "# Planned\nUpdated",
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

});

describe("experiment and ops guarded write contracts", () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.BOS_AGENT_API_BASE_URL;
  const originalApiKey = process.env.BOS_AGENT_API_KEY;

  beforeEach(() => {
    process.env.BOS_AGENT_API_BASE_URL = "http://localhost:3020";
    process.env.BOS_AGENT_API_KEY = "bos_test_key_1234567890";
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    process.env.BOS_AGENT_API_BASE_URL = originalBaseUrl;
    process.env.BOS_AGENT_API_KEY = originalApiKey;
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it("TC-07: exp_register missing guarded fields fails closed before network call", async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;

    const result = await handleBosTool("exp_register", {
      business: "BRIK",
      cardId: "BRIK-ENG-0001",
      stage: "experiment-runtime",
      runId: "run-001",
      current_stage: "S8",
      experiment: {
        experimentId: "EXP-001",
        hypothesisId: "HYP-001",
        metric: "bookings_confirmed",
        allocationUnit: "booking",
        rolloutPercent: 10,
        variants: [
          { id: "control", weight: 0.5 },
          { id: "challenger", weight: 0.5 },
        ],
      },
    });

    const payload = parsePayload(result);
    expect(result.isError).toBe(true);
    expect(payload.error.code).toBe("CONTRACT_MISMATCH");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("TC-08: exp_register valid guarded payload returns audit + provenance metadata", async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        entity: {
          "Card-ID": "BRIK-ENG-0001",
          Stage: "experiment-runtime",
          Updated: "2026-02-13T23:40:00Z",
          content: "# Experiment Runtime\nregistered",
        },
        entitySha: "sha-exp-next",
      }),
    });

    const result = await handleBosTool("exp_register", {
      business: "BRIK",
      cardId: "BRIK-ENG-0001",
      stage: "experiment-runtime",
      runId: "run-001",
      current_stage: "S8",
      write_reason: "register experiment runtime envelope",
      baseEntitySha: "sha-exp-prev",
      auditTag: "exp:register:guarded",
      provenance: sharedProvenance,
      experiment: {
        experimentId: "EXP-001",
        hypothesisId: "HYP-001",
        metric: "bookings_confirmed",
        allocationUnit: "booking",
        rolloutPercent: 10,
        variants: [
          { id: "control", weight: 0.5 },
          { id: "challenger", weight: 0.5 },
        ],
      },
    });

    const payload = parsePayload(result);
    expect(result.isError).toBeUndefined();
    expect(payload.schemaVersion).toBe("exp.register.result.v1");
    expect(payload.stageDoc.entitySha).toBe("sha-exp-next");
    expect(payload.audit.auditTag).toBe("exp:register:guarded");
    expect(payload.audit.request.baseEntitySha).toBe("[REDACTED]");
    expect(payload.provenance).toEqual(sharedProvenance);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("TC-09: exp_register stale entitySha returns deterministic conflict envelope", async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      statusText: "Conflict",
      json: async () => ({
        error: "CONFLICT",
        currentEntitySha: "sha-exp-current",
      }),
    });

    const result = await handleBosTool("exp_register", {
      business: "BRIK",
      cardId: "BRIK-ENG-0001",
      stage: "experiment-runtime",
      runId: "run-001",
      current_stage: "S8",
      write_reason: "register experiment runtime envelope",
      baseEntitySha: "sha-exp-stale",
      auditTag: "exp:register:guarded",
      provenance: sharedProvenance,
      experiment: {
        experimentId: "EXP-001",
        hypothesisId: "HYP-001",
        metric: "bookings_confirmed",
        allocationUnit: "booking",
        rolloutPercent: 10,
        variants: [
          { id: "control", weight: 0.5 },
          { id: "challenger", weight: 0.5 },
        ],
      },
    });

    const payload = parsePayload(result);
    expect(result.isError).toBe(true);
    expect(payload.error.code).toBe("CONFLICT_ENTITY_SHA");
    expect(payload.error.details.re_read_required).toBe(true);
    expect(payload.error.details.currentEntitySha).toBe("sha-exp-current");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("TC-10: ops_update_price_guarded redacts sensitive values and keeps audit fields", async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        entity: {
          "Card-ID": "BRIK-OPS-0001",
          Stage: "ops-runtime",
          Updated: "2026-02-13T23:50:00Z",
          content: "# Ops Runtime\nprice update queued",
        },
        entitySha: "sha-ops-next",
      }),
    });

    const result = await handleBosTool("ops_update_price_guarded", {
      business: "BRIK",
      cardId: "BRIK-OPS-0001",
      stage: "ops-runtime",
      runId: "run-001",
      current_stage: "S9",
      write_reason: "queue guarded price update",
      baseEntitySha: "sha-ops-prev",
      auditTag: "ops:update-price:guarded",
      provenance: sharedProvenance,
      operation: {
        action: "update_price",
        sku: "room-night-standard",
        currency: "EUR",
        oldPrice: 100,
        newPrice: 112,
        approvalToken: "internal-secret-token",
      },
    });

    const payload = parsePayload(result);
    expect(result.isError).toBeUndefined();
    expect(payload.schemaVersion).toBe("ops.update-price.result.v1");
    expect(payload.audit.auditTag).toBe("ops:update-price:guarded");
    expect(payload.audit.request.baseEntitySha).toBe("[REDACTED]");
    expect(payload.audit.request.operation.approvalToken).toBe("[REDACTED]");
    expect(payload.audit.request.operation.sku).toBe("room-night-standard");
    expect(payload.stageDoc.entitySha).toBe("sha-ops-next");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
