/** @jest-environment node */

import { promises as fs } from "fs";
import os from "os";
import path from "path";

import { handleBosTool } from "../tools/bos";
import { handleLoopTool } from "../tools/loop";

const FIXTURE_ROOT = path.join(process.cwd(), "packages/mcp-server/src/__tests__/fixtures");
const BOS_FIXTURES = path.join(FIXTURE_ROOT, "bos-api");
const LOOP_FIXTURES = path.join(FIXTURE_ROOT, "startup-loop");

type BosStatusCase = "success" | "auth" | "not-found" | "conflict" | "unavailable";

type MockResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
};

function makeJsonResponse(status: number, body: unknown): MockResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText:
      status === 200
        ? "OK"
        : status === 401
          ? "Unauthorized"
          : status === 404
            ? "Not Found"
            : status === 409
              ? "Conflict"
              : "Service Unavailable",
    json: async () => body,
  };
}

async function readFixtureJson<T>(directory: string, fileName: string): Promise<T> {
  const content = await fs.readFile(path.join(directory, fileName), "utf-8");
  return JSON.parse(content) as T;
}

async function writeFixtureFile(sourcePath: string, targetPath: string) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  const content = await fs.readFile(sourcePath, "utf-8");
  await fs.writeFile(targetPath, content, "utf-8");
}

function parseResultPayload(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text) as Record<string, unknown>;
}

describe("startup-loop MCP integration suite", () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.BOS_AGENT_API_BASE_URL;
  const originalApiKey = process.env.BOS_AGENT_API_KEY;
  const originalArtifactRoot = process.env.STARTUP_LOOP_ARTIFACT_ROOT;
  const originalStaleThreshold = process.env.STARTUP_LOOP_STALE_THRESHOLD_SECONDS;

  let tempRoot = "";
  let bosStatusCase: BosStatusCase = "success";

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-startup-loop-integration-"));
    process.env.BOS_AGENT_API_BASE_URL = "http://localhost:3020";
    process.env.BOS_AGENT_API_KEY = "bos_test_key_1234567890";
    process.env.STARTUP_LOOP_ARTIFACT_ROOT = tempRoot;
    process.env.STARTUP_LOOP_STALE_THRESHOLD_SECONDS = "2592000";
    bosStatusCase = "success";

    const fixtures = {
      cards: await readFixtureJson<Record<string, unknown>>(BOS_FIXTURES, "cards-list.success.json"),
      stageDocGet: await readFixtureJson<Record<string, unknown>>(BOS_FIXTURES, "stage-doc.get.success.json"),
      stageDocPatch: await readFixtureJson<Record<string, unknown>>(BOS_FIXTURES, "stage-doc.patch.success.json"),
      conflict: await readFixtureJson<Record<string, unknown>>(
        BOS_FIXTURES,
        "stage-doc.patch.conflict.json"
      ),
      error401: await readFixtureJson<Record<string, unknown>>(BOS_FIXTURES, "error.401.json"),
      error404: await readFixtureJson<Record<string, unknown>>(BOS_FIXTURES, "error.404.json"),
      error500: await readFixtureJson<Record<string, unknown>>(BOS_FIXTURES, "error.500.json"),
    };

    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = (init?.method ?? "GET").toUpperCase();

      if (bosStatusCase === "auth") {
        return makeJsonResponse(401, fixtures.error401);
      }
      if (bosStatusCase === "unavailable") {
        return makeJsonResponse(503, fixtures.error500);
      }

      if (method === "GET" && url.includes("/api/agent/cards")) {
        return makeJsonResponse(200, fixtures.cards);
      }

      if (method === "GET" && url.includes("/api/agent/stage-docs/")) {
        if (bosStatusCase === "not-found") {
          return makeJsonResponse(404, fixtures.error404);
        }
        return makeJsonResponse(200, fixtures.stageDocGet);
      }

      if (method === "PATCH" && url.includes("/api/agent/stage-docs/")) {
        if (bosStatusCase === "conflict") {
          return makeJsonResponse(409, fixtures.conflict);
        }
        return makeJsonResponse(200, fixtures.stageDocPatch);
      }

      return makeJsonResponse(404, fixtures.error404);
    }) as unknown as typeof fetch;
  });

  afterEach(async () => {
    process.env.BOS_AGENT_API_BASE_URL = originalBaseUrl;
    process.env.BOS_AGENT_API_KEY = originalApiKey;
    process.env.STARTUP_LOOP_ARTIFACT_ROOT = originalArtifactRoot;
    process.env.STARTUP_LOOP_STALE_THRESHOLD_SECONDS = originalStaleThreshold;
    global.fetch = originalFetch;
    await fs.rm(tempRoot, { recursive: true, force: true });
    jest.resetAllMocks();
  });

  it("TC-01: BOS read tools succeed with fixture-backed API stubs", async () => {
    const cards = await handleBosTool("bos_cards_list", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
    });

    const stageDoc = await handleBosTool("bos_stage_doc_get", {
      business: "BRIK",
      cardId: "BRIK-ENG-0001",
      stage: "plan",
      runId: "run-001",
      current_stage: "S7",
    });

    const cardsPayload = parseResultPayload(cards);
    const stageDocPayload = parseResultPayload(stageDoc);

    expect(cardsPayload.count).toBe(1);
    expect(stageDocPayload.stageDoc).toEqual(
      expect.objectContaining({
        cardId: "BRIK-ENG-0001",
        entitySha: "sha-plan-current",
      })
    );
  });

  it("TC-02: guarded write success path returns updated entitySha", async () => {
    const result = await handleBosTool("bos_stage_doc_patch_guarded", {
      business: "BRIK",
      cardId: "BRIK-ENG-0001",
      stage: "plan",
      runId: "run-001",
      current_stage: "S7",
      write_reason: "sync plan stage doc",
      baseEntitySha: "sha-plan-current",
      patch: { content: "# Planned\n\nUpdated from MCP write." },
    });

    const payload = parseResultPayload(result);
    expect(payload.stageDoc).toEqual(
      expect.objectContaining({
        entitySha: "sha-plan-next",
      })
    );
  });

  it("TC-03: guarded write stale-sha path returns CONFLICT_ENTITY_SHA", async () => {
    bosStatusCase = "conflict";

    const result = await handleBosTool("bos_stage_doc_patch_guarded", {
      business: "BRIK",
      cardId: "BRIK-ENG-0001",
      stage: "plan",
      runId: "run-001",
      current_stage: "S7",
      write_reason: "sync plan stage doc",
      baseEntitySha: "sha-stale",
      patch: { content: "# Planned\n\nUpdated from MCP write." },
    });

    const payload = parseResultPayload(result);
    expect(result.isError).toBe(true);
    expect(payload.error).toEqual(
      expect.objectContaining({
        code: "CONFLICT_ENTITY_SHA",
      })
    );
  });

  it("TC-04: stage-forbidden write returns FORBIDDEN_STAGE without side effects", async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;

    const result = await handleBosTool("bos_stage_doc_patch_guarded", {
      business: "BRIK",
      cardId: "BRIK-ENG-0001",
      stage: "plan",
      runId: "run-001",
      current_stage: "S2A",
      write_reason: "sync plan stage doc",
      baseEntitySha: "sha-plan-current",
      patch: { content: "# Planned\n\nUpdated from MCP write." },
    });

    const payload = parseResultPayload(result);
    expect(result.isError).toBe(true);
    expect(payload.error).toEqual(
      expect.objectContaining({
        code: "FORBIDDEN_STAGE",
      })
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("TC-05: loop tools cover missing + complete + stale fixture states", async () => {
    const missing = await handleLoopTool("loop_manifest_status", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
    });
    const missingPayload = parseResultPayload(missing);
    expect(missing.isError).toBe(true);
    expect(missingPayload.error).toEqual(
      expect.objectContaining({
        code: "MISSING_ARTIFACT",
      })
    );

    const runRoot = path.join(
      tempRoot,
      "docs/business-os/startup-baselines/BRIK/runs/run-001"
    );
    const businessRoot = path.join(tempRoot, "docs/business-os/startup-baselines/BRIK");

    await writeFixtureFile(
      path.join(LOOP_FIXTURES, "manifest.complete.json"),
      path.join(runRoot, "baseline.manifest.json")
    );
    await writeFixtureFile(
      path.join(LOOP_FIXTURES, "learning-ledger.complete.jsonl"),
      path.join(businessRoot, "learning-ledger.jsonl")
    );
    await writeFixtureFile(
      path.join(LOOP_FIXTURES, "metrics.partial.jsonl"),
      path.join(runRoot, "metrics.jsonl")
    );

    const complete = await handleLoopTool("loop_manifest_status", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
    });
    const completePayload = parseResultPayload(complete);
    expect(complete.isError).toBeUndefined();
    expect(completePayload.freshness).toEqual(
      expect.objectContaining({
        status: expect.any(String),
      })
    );

    await writeFixtureFile(
      path.join(LOOP_FIXTURES, "manifest.stale.json"),
      path.join(runRoot, "baseline.manifest.json")
    );
    process.env.STARTUP_LOOP_STALE_THRESHOLD_SECONDS = "60";

    const stale = await handleLoopTool("loop_manifest_status", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
    });
    const stalePayload = parseResultPayload(stale);
    expect(stalePayload.freshness).toEqual(
      expect.objectContaining({
        status: "stale",
      })
    );
  });

  it("TC-06: startup-loop Jest wrapper config captures stable ignore patterns", async () => {
    const configPath = path.join(process.cwd(), "packages/mcp-server/jest.startup-loop.config.cjs");
    const configText = await fs.readFile(configPath, "utf-8");

    expect(configText).toContain(".open-next");
    expect(configText).toContain(".worktrees");
    expect(configText).toContain(".ts-jest");
    expect(configText).toContain("startup-loop-tools.integration.test.ts");
  });

  it("TC-07: wave-2 vertical slice builds deterministic packet and pack artifacts", async () => {
    const runRoot = path.join(
      tempRoot,
      "docs/business-os/startup-baselines/BRIK/runs/run-001"
    );

    await writeFixtureFile(
      path.join(LOOP_FIXTURES, "manifest.complete.json"),
      path.join(runRoot, "baseline.manifest.json")
    );
    await writeFixtureFile(
      path.join(LOOP_FIXTURES, "metrics.partial.jsonl"),
      path.join(runRoot, "metrics.jsonl")
    );

    const measure = await handleLoopTool("measure_snapshot_get", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
    });
    const measurePayload = parseResultPayload(measure);
    expect(measurePayload.recordCount).toBeGreaterThan(0);

    const packetOne = await handleLoopTool("app_run_packet_build", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
    });
    const packetTwo = await handleLoopTool("app_run_packet_build", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
    });

    const packetOnePayload = parseResultPayload(packetOne);
    const packetTwoPayload = parseResultPayload(packetTwo);
    expect(packetOnePayload.packetId).toBe(packetTwoPayload.packetId);
    expect(packetOnePayload.sizeBytes).toBe(packetTwoPayload.sizeBytes);
    expect(packetOnePayload.provenance).toEqual(packetTwoPayload.provenance);

    const packetGet = await handleLoopTool("app_run_packet_get", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
      packetId: packetOnePayload.packetId,
    });
    const packetGetPayload = parseResultPayload(packetGet);
    expect(packetGetPayload.packetId).toBe(packetOnePayload.packetId);

    const packOne = await handleLoopTool("pack_weekly_s10_build", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
      packetId: packetOnePayload.packetId,
    });
    const packTwo = await handleLoopTool("pack_weekly_s10_build", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
      packetId: packetOnePayload.packetId,
    });

    const packOnePayload = parseResultPayload(packOne);
    const packTwoPayload = parseResultPayload(packTwo);
    expect(packOnePayload.provenance).toEqual(packTwoPayload.provenance);
    expect(packOnePayload.packJsonPath).toBe(packTwoPayload.packJsonPath);
    expect(packOnePayload.packMarkdownPath).toBe(packTwoPayload.packMarkdownPath);

    const packJsonPath = String(packOnePayload.packJsonPath);
    const packMarkdownPath = String(packOnePayload.packMarkdownPath);
    const jsonOne = await fs.readFile(packJsonPath, "utf-8");
    const jsonTwo = await fs.readFile(String(packTwoPayload.packJsonPath), "utf-8");
    const markdownOne = await fs.readFile(packMarkdownPath, "utf-8");
    const markdownTwo = await fs.readFile(String(packTwoPayload.packMarkdownPath), "utf-8");
    expect(jsonOne).toBe(jsonTwo);
    expect(markdownOne).toBe(markdownTwo);
  });
});
