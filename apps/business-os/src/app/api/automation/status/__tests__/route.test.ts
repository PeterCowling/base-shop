import * as fs from "node:fs/promises";

import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { getDb } from "@/lib/d1.server";

import { GET } from "../route";

jest.mock("@/lib/d1.server", () => ({
  getDb: jest.fn(),
}));

jest.mock("node:fs/promises", () => ({
  readdir: jest.fn(),
  stat: jest.fn(),
  readFile: jest.fn(),
}));

const mockFirst = jest.fn();
const mockPrepare = jest.fn(() => ({ first: mockFirst }));

const mockReaddir = fs.readdir as jest.MockedFunction<typeof fs.readdir>;
const mockStat = fs.stat as jest.MockedFunction<typeof fs.stat>;
const mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;

describe("/api/automation/status", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (getDb as jest.MockedFunction<typeof getDb>).mockReturnValue({
      prepare: mockPrepare,
    } as ReturnType<typeof getDb>);
    mockPrepare.mockReturnValue({ first: mockFirst });
    mockFirst.mockResolvedValue({ ok: 1 });

    mockReaddir.mockRejectedValue(new Error("missing sweeps dir"));
    mockStat.mockRejectedValue(new Error("missing file"));
    mockReadFile.mockResolvedValue("");
  });

  it("TC-01: returns canonical schema with unknown automation when sweep/index files absent", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload).toEqual(
      expect.objectContaining({
        status: "ok",
        d1: "ok",
        automation: {
          lastSweepRunStatus: "unknown",
          discoveryIndexStatus: "unknown",
          lastSweepAt: null,
          source: "none",
        },
      })
    );
    expect(typeof payload.timestamp).toBe("string");
  });

  it("TC-02: reports degraded when D1 connectivity fails", async () => {
    mockFirst.mockRejectedValueOnce(new Error("db unavailable"));

    const response = await GET();
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.status).toBe("degraded");
    expect(payload.d1).toBe("error");
  });

  it("TC-03: maps partial + stale sweep markers to degraded automation state", async () => {
    mockReaddir.mockResolvedValue(["2026-02-09-sweep.user.md"] as unknown as Awaited<
      ReturnType<typeof fs.readdir>
    >);

    mockStat.mockImplementation(async (target) => {
      const fullPath = String(target);
      if (fullPath.includes("/docs/business-os/sweeps/")) {
        return { mtimeMs: 2000 } as Awaited<ReturnType<typeof fs.stat>>;
      }
      if (fullPath.endsWith("/docs/business-os/_meta/discovery-index.json")) {
        return { mtimeMs: 1000 } as Awaited<ReturnType<typeof fs.stat>>;
      }
      throw new Error("unexpected path");
    });

    mockReadFile.mockResolvedValue(
      "Run-Status: partial\n\n- Add explicit marker: discovery-index stale.\n" as Awaited<
        ReturnType<typeof fs.readFile>
      >
    );

    const response = await GET();
    const payload = await response.json();

    expect(payload.status).toBe("degraded");
    expect(payload.automation.lastSweepRunStatus).toBe("partial");
    expect(payload.automation.discoveryIndexStatus).toBe("stale");
    expect(payload.automation.source).toBe("sweeps/2026-02-09-sweep.user.md+discovery-index");
    expect(typeof payload.automation.lastSweepAt).toBe("string");
  });

  it("TC-04: reports healthy automation when sweep is complete and index is fresh", async () => {
    mockReaddir.mockResolvedValue(["2026-02-10-sweep.user.md"] as unknown as Awaited<
      ReturnType<typeof fs.readdir>
    >);

    mockStat.mockImplementation(async (target) => {
      const fullPath = String(target);
      if (fullPath.includes("/docs/business-os/sweeps/")) {
        return { mtimeMs: 1000 } as Awaited<ReturnType<typeof fs.stat>>;
      }
      if (fullPath.endsWith("/docs/business-os/_meta/discovery-index.json")) {
        return { mtimeMs: 3000 } as Awaited<ReturnType<typeof fs.stat>>;
      }
      throw new Error("unexpected path");
    });

    mockReadFile.mockResolvedValue("Run-Status: complete\n" as Awaited<ReturnType<typeof fs.readFile>>);

    const response = await GET();
    const payload = await response.json();

    expect(payload.status).toBe("ok");
    expect(payload.automation.lastSweepRunStatus).toBe("complete");
    expect(payload.automation.discoveryIndexStatus).toBe("fresh");
  });
});
