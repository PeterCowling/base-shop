/** @jest-environment node */

import { handleBosTool } from "../tools/bos";

describe("bos tools", () => {
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

  it("TC-01: bos_cards_list returns business-scoped shaped cards", async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        cards: [
          {
            ID: "BRIK-ENG-0001",
            Business: "BRIK",
            Title: "Stage tooling",
            Lane: "Fact-finding",
            Priority: "P1",
            Owner: "PLAT",
            "Feature-Slug": "mcp-startup-loop-data-plane",
            "Plan-Link": "docs/plans/mcp-startup-loop-data-plane/plan.md",
            content: "should-not-leak",
            filePath: "docs/business-os/cards/BRIK-ENG-0001.user.md",
          },
        ],
      }),
    });

    const result = await handleBosTool("bos_cards_list", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "DO",
    });

    const payload = JSON.parse(result.content[0].text);
    expect(payload.business).toBe("BRIK");
    expect(payload.count).toBe(1);
    expect(payload.cards[0]).toEqual(
      expect.objectContaining({
        id: "BRIK-ENG-0001",
        business: "BRIK",
        title: "Stage tooling",
        featureSlug: "mcp-startup-loop-data-plane",
      })
    );
    expect(payload.cards[0].content).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3020/api/agent/cards?business=BRIK",
      expect.objectContaining({
        method: "GET",
        headers: {
          "X-Agent-API-Key": "bos_test_key_1234567890",
        },
      })
    );
  });

  it("TC-02: bos_stage_doc_get returns shaped stage doc with entitySha", async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        entity: {
          "Card-ID": "BRIK-ENG-0001",
          Stage: "fact-find",
          Created: "2026-02-13",
          Updated: "2026-02-14",
          content: "# Fact-find",
          filePath: "docs/business-os/cards/BRIK-ENG-0001/fact-find.user.md",
        },
        entitySha: "sha-123",
      }),
    });

    const result = await handleBosTool("bos_stage_doc_get", {
      business: "BRIK",
      cardId: "BRIK-ENG-0001",
      stage: "fact-find",
      runId: "run-001",
      current_stage: "DO",
    });

    const payload = JSON.parse(result.content[0].text);
    expect(payload.stageDoc).toEqual(
      expect.objectContaining({
        cardId: "BRIK-ENG-0001",
        stage: "fact-find",
        entitySha: "sha-123",
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3020/api/agent/stage-docs/BRIK-ENG-0001/fact-find",
      expect.any(Object)
    );
  });

  it("TC-03: maps auth failures to AUTH_FAILED", async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ error: "Unauthorized" }),
    });

    const result = await handleBosTool("bos_cards_list", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "DO",
    });

    const payload = JSON.parse(result.content[0].text);
    expect(result.isError).toBe(true);
    expect(payload.error.code).toBe("AUTH_FAILED");
    expect(payload.error.retryable).toBe(false);
  });

  it("TC-04: maps missing stage docs to NOT_FOUND", async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({ error: "Stage doc not found" }),
    });

    const result = await handleBosTool("bos_stage_doc_get", {
      business: "BRIK",
      cardId: "BRIK-ENG-0001",
      stage: "fact-find",
      runId: "run-001",
      current_stage: "DO",
    });

    const payload = JSON.parse(result.content[0].text);
    expect(result.isError).toBe(true);
    expect(payload.error.code).toBe("NOT_FOUND");
    expect(payload.error.retryable).toBe(false);
  });

  it("TC-05: maps upstream 5xx to UPSTREAM_UNAVAILABLE", async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: async () => ({ error: "Unavailable" }),
    });

    const result = await handleBosTool("bos_cards_list", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "DO",
    });

    const payload = JSON.parse(result.content[0].text);
    expect(result.isError).toBe(true);
    expect(payload.error.code).toBe("UPSTREAM_UNAVAILABLE");
    expect(payload.error.retryable).toBe(true);
  });

  it("TC-06: missing BOS env config returns CONTRACT_MISMATCH", async () => {
    delete process.env.BOS_AGENT_API_BASE_URL;

    const result = await handleBosTool("bos_cards_list", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "DO",
    });

    const payload = JSON.parse(result.content[0].text);
    expect(result.isError).toBe(true);
    expect(payload.error.code).toBe("CONTRACT_MISMATCH");
  });

  it("TC-07: bos_stage_doc_patch_guarded updates stage doc with new entitySha", async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        entity: {
          "Card-ID": "BRIK-ENG-0001",
          Stage: "plan",
          Updated: "2026-02-14",
          content: "# Planned\nupdated",
        },
        entitySha: "sha-next",
      }),
    });

    const result = await handleBosTool("bos_stage_doc_patch_guarded", {
      business: "BRIK",
      cardId: "BRIK-ENG-0001",
      stage: "plan",
      runId: "run-001",
      current_stage: "DO",
      write_reason: "sync latest plan state",
      baseEntitySha: "sha-prev",
      patch: {
        content: "# Planned\nupdated",
      },
    });

    const payload = JSON.parse(result.content[0].text);
    expect(payload.stageDoc).toEqual(
      expect.objectContaining({
        cardId: "BRIK-ENG-0001",
        stage: "plan",
        entitySha: "sha-next",
      })
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3020/api/agent/stage-docs/BRIK-ENG-0001/plan",
      expect.objectContaining({
        method: "PATCH",
        headers: {
          "X-Agent-API-Key": "bos_test_key_1234567890",
          "Content-Type": "application/json",
        },
      })
    );
  });

  it("TC-08: bos_stage_doc_patch_guarded returns CONFLICT_ENTITY_SHA without auto-retry", async () => {
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
      current_stage: "DO",
      write_reason: "sync latest plan state",
      baseEntitySha: "sha-stale",
      patch: {
        content: "# Planned\nupdated",
      },
    });

    const payload = JSON.parse(result.content[0].text);
    expect(result.isError).toBe(true);
    expect(payload.error.code).toBe("CONFLICT_ENTITY_SHA");
    expect(payload.error.retryable).toBe(false);
    expect(payload.error.details.currentEntitySha).toBe("sha-current");
    expect(payload.error.details.re_read_required).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
