import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";

import { onRequestPost } from "../decision";

type MockDb = {
  prepare: jest.Mock;
  batch: jest.Mock;
};

function createMockDb(launchRow: { id: string; candidate_id: string } | null): MockDb {
  const selectFirst = jest.fn().mockResolvedValue(launchRow);
  const prepare = jest.fn((sql: string) => ({
    bind: (...args: unknown[]) => {
      if (sql.includes("SELECT id, candidate_id FROM launch_plans")) {
        return { first: selectFirst };
      }
      return { sql, args };
    },
  }));

  return {
    prepare,
    batch: jest.fn().mockResolvedValue(undefined),
  };
}

describe("launch decision route", () => {
  const originalCrypto = globalThis.crypto;

  beforeAll(() => {
    const shimmedCrypto = Object.create(originalCrypto ?? null) as {
      randomUUID?: () => string;
    };
    shimmedCrypto.randomUUID = () => "decision-id-fixed";

    Object.defineProperty(globalThis, "crypto", {
      value: shimmedCrypto,
      configurable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(globalThis, "crypto", {
      value: originalCrypto,
      configurable: true,
    });
  });

  it("returns 400 for invalid request payload", async () => {
    const db = createMockDb(null);
    const response = await onRequestPost({
      request: new Request("https://pipeline.test/api/launches/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ launchId: "" }),
      }),
      env: { PIPELINE_DB: db },
    } as any);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_body",
    });
    expect(db.batch).not.toHaveBeenCalled();
  });

  it("returns 404 when launch does not exist", async () => {
    const db = createMockDb(null);
    const response = await onRequestPost({
      request: new Request("https://pipeline.test/api/launches/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          launchId: "launch-missing",
          decision: "SCALE",
        }),
      }),
      env: { PIPELINE_DB: db },
    } as any);

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "launch_not_found",
      details: { launchId: "launch-missing" },
    });
    expect(db.batch).not.toHaveBeenCalled();
  });

  it("persists launch decision and candidate update for valid payload", async () => {
    const db = createMockDb({ id: "launch-1", candidate_id: "candidate-1" });
    const response = await onRequestPost({
      request: new Request("https://pipeline.test/api/launches/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          launchId: "launch-1",
          decision: "KILL",
          notes: "Low confidence in demand durability",
          requestedBy: "operator@example.com",
        }),
      }),
      env: { PIPELINE_DB: db },
    } as any);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      launchId: "launch-1",
      decisionId: expect.any(String),
    });

    expect(db.batch).toHaveBeenCalledTimes(1);
    const statements = db.batch.mock.calls[0][0] as unknown[];
    expect(Array.isArray(statements)).toBe(true);
    expect(statements).toHaveLength(3);
  });
});
