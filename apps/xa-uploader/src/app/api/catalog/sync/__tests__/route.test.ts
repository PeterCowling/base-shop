import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { EventEmitter } from "node:events";

import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const spawnMock = jest.fn();
const accessMock = jest.fn();
const mkdirMock = jest.fn();
const hasUploaderSessionMock = jest.fn();

jest.mock("node:child_process", () => ({
  spawn: (...args: unknown[]) => spawnMock(...args),
}));

jest.mock("node:fs/promises", () => ({
  __esModule: true,
  default: {
    access: (...args: unknown[]) => accessMock(...args),
    mkdir: (...args: unknown[]) => mkdirMock(...args),
  },
}));

jest.mock("../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

jest.mock("../../../../../lib/repoRoot", () => ({
  resolveRepoRoot: () => "/repo",
}));

jest.mock("../../../../../lib/catalogCsv", () => ({
  resolveXaUploaderProductsCsvPath: () => "/repo/apps/xa-uploader/data/products.xa-b.csv",
}));

jest.mock("../../../../../lib/catalogStorefront.server", () => ({
  resolveStorefrontCatalogPaths: () => ({
    catalogOutPath: "/repo/apps/xa-out/catalog.json",
    mediaOutPath: "/repo/apps/xa-out/media",
  }),
}));

function createChild(
  code: number,
  stdout = "",
  stderr = "",
): ChildProcessWithoutNullStreams {
  const child = new EventEmitter() as ChildProcessWithoutNullStreams;
  const childStdout = new EventEmitter();
  const childStderr = new EventEmitter();

  Object.assign(child, {
    stdout: childStdout,
    stderr: childStderr,
  });

  process.nextTick(() => {
    if (stdout) childStdout.emit("data", Buffer.from(stdout, "utf8"));
    if (stderr) childStderr.emit("data", Buffer.from(stderr, "utf8"));
    child.emit("close", code);
  });

  return child;
}

describe("catalog sync route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hasUploaderSessionMock.mockResolvedValue(true);
    mkdirMock.mockResolvedValue(undefined);
    delete process.env.XA_UPLOADER_MODE;
  });

  it("TC-01: returns deterministic dependency error when required scripts are missing", async () => {
    accessMock
      .mockRejectedValueOnce(new Error("missing validate script"))
      .mockRejectedValueOnce(new Error("missing sync script"));

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storefront: "xa-b",
          options: { strict: true, recursive: true },
        }),
      }),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        error: "sync_dependencies_missing",
        recovery: "restore_sync_scripts",
        missingScripts: ["validate", "sync"],
      }),
    );
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it("TC-02: returns validation_failed with logs when validate script exits non-zero", async () => {
    accessMock.mockResolvedValue(undefined);
    spawnMock.mockImplementationOnce(() => createChild(2, "validate stdout", "validate stderr"));

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storefront: "xa-b",
          options: { strict: true, recursive: true },
        }),
      }),
    );

    const payload = await response.json();
    expect(response.status).toBe(400);
    expect(payload).toEqual(
      expect.objectContaining({
        ok: false,
        error: "validation_failed",
        recovery: "review_validation_logs",
      }),
    );
    expect(payload.logs?.validate).toEqual(
      expect.objectContaining({
        code: 2,
        stdout: "validate stdout",
        stderr: "validate stderr",
      }),
    );
    expect(spawnMock).toHaveBeenCalledTimes(1);
  });

  it("TC-03: returns sync_failed with logs when sync script exits non-zero", async () => {
    accessMock.mockResolvedValue(undefined);
    spawnMock
      .mockImplementationOnce(() => createChild(0, "validate ok", ""))
      .mockImplementationOnce(() => createChild(3, "sync stdout", "sync stderr"));

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storefront: "xa-b",
          options: { strict: true, recursive: true },
        }),
      }),
    );

    const payload = await response.json();
    expect(response.status).toBe(400);
    expect(payload).toEqual(
      expect.objectContaining({
        ok: false,
        error: "sync_failed",
        recovery: "review_sync_logs",
      }),
    );
    expect(payload.logs?.sync).toEqual(
      expect.objectContaining({
        code: 3,
        stdout: "sync stdout",
        stderr: "sync stderr",
      }),
    );
    expect(spawnMock).toHaveBeenCalledTimes(2);
  });
});
