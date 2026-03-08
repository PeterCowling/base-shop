import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { __clearRateLimitStoreForTests } from "../../../../../lib/rateLimit";

const hasUploaderSessionMock = jest.fn();
const getUploaderKvMock = jest.fn();

jest.mock("../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

jest.mock("../../../../../lib/syncMutex", () => ({
  getUploaderKv: (...args: unknown[]) => getUploaderKvMock(...args),
}));

describe("catalog deploy-drain route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __clearRateLimitStoreForTests();
    hasUploaderSessionMock.mockResolvedValue(false);
    process.env.XA_UPLOADER_LOCAL_FS_DISABLED = "1";
    process.env.XA_UPLOADER_DEPLOY_DRAIN_TOKEN = "drain-secret";
    delete process.env.XA_B_DEPLOY_HOOK_URL;
    delete process.env.XA_B_DEPLOY_HOOK_REQUIRED;
    delete process.env.XA_B_DEPLOY_HOOK_MAX_RETRIES;
    delete process.env.XA_UPLOADER_MODE;
  });

  it("returns 404 when request is not authorized", async () => {
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/deploy-drain?storefront=xa-b", { method: "POST" }),
    );
    expect(response.status).toBe(404);
    expect(response.headers.get("x-ratelimit-limit")).toBeNull();
    expect(response.headers.get("x-ratelimit-remaining")).toBeNull();
    expect(response.headers.get("x-ratelimit-reset")).toBeNull();
  });

  it("returns idle_no_pending when no pending deploy is recorded", async () => {
    const kvStore = new Map<string, string>();
    const kv = {
      get: jest.fn(async (key: string) => kvStore.get(key) ?? null),
      put: jest.fn(async () => undefined),
      delete: jest.fn(async () => undefined),
    };
    getUploaderKvMock.mockResolvedValue(kv as unknown as import("../../../../../lib/syncMutex").UploaderKvNamespace);

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/deploy-drain?storefront=xa-b", {
        method: "POST",
        headers: { authorization: "Bearer drain-secret" },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-ratelimit-limit")).toBe("30");
    expect(response.headers.get("x-ratelimit-remaining")).toBe("29");
    expect(response.headers.get("x-ratelimit-reset")).toBeTruthy();
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        storefront: "xa-b",
        status: "idle_no_pending",
      }),
    );
  });

  it("triggers deploy for pending state and clears pending marker", async () => {
    process.env.XA_B_DEPLOY_HOOK_URL = "https://deploy.example/hook";
    process.env.XA_B_DEPLOY_HOOK_MAX_RETRIES = "0";

    const kvStore = new Map<string, string>();
    kvStore.set(
      "xa-deploy-pending:xa-b",
      JSON.stringify({
        pending: true,
        storefront: "xa-b",
        reasonCode: "failed",
        firstDetectedAt: "2026-03-05T00:00:00.000Z",
        lastUpdatedAt: "2026-03-05T00:00:00.000Z",
        attempts: 1,
      }),
    );

    const kv = {
      get: jest.fn(async (key: string) => kvStore.get(key) ?? null),
      put: jest.fn(async (key: string, value: string) => {
        kvStore.set(key, value);
      }),
      delete: jest.fn(async (key: string) => {
        kvStore.delete(key);
      }),
    };
    getUploaderKvMock.mockResolvedValue(kv as unknown as import("../../../../../lib/syncMutex").UploaderKvNamespace);

    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(new Response("", { status: 200 }));
    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/deploy-drain?storefront=xa-b", {
        method: "POST",
        headers: { authorization: "Bearer drain-secret" },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        storefront: "xa-b",
        status: "triggered",
        deploy: expect.objectContaining({ status: "triggered" }),
      }),
    );
    expect(kv.delete).toHaveBeenCalledWith("xa-deploy-pending:xa-b");
    fetchSpy.mockRestore();
  });

  it("returns pending with skipped_cooldown when cooldown window is active", async () => {
    process.env.XA_B_DEPLOY_HOOK_URL = "https://deploy.example/hook";
    process.env.XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS = "900";

    const cooldownUntil = "2026-03-05T10:29:35.119Z";
    const kvStore = new Map<string, string>();
    kvStore.set(
      "xa-deploy-pending:xa-b",
      JSON.stringify({
        pending: true,
        storefront: "xa-b",
        reasonCode: "failed",
        firstDetectedAt: "2026-03-05T10:00:00.000Z",
        lastUpdatedAt: "2026-03-05T10:00:00.000Z",
        attempts: 1,
      }),
    );
    kvStore.set(
      "xa-deploy-cooldown:xa-b",
      JSON.stringify({
        storefront: "xa-b",
        nextEligibleAt: cooldownUntil,
        updatedAt: "2026-03-05T10:00:00.000Z",
      }),
    );

    const kv = {
      get: jest.fn(async (key: string) => kvStore.get(key) ?? null),
      put: jest.fn(async (key: string, value: string) => {
        kvStore.set(key, value);
      }),
      delete: jest.fn(async (key: string) => {
        kvStore.delete(key);
      }),
    };
    getUploaderKvMock.mockResolvedValue(kv as unknown as import("../../../../../lib/syncMutex").UploaderKvNamespace);

    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(new Response("", { status: 200 }));
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-03-05T10:20:00.000Z"));

    try {
      const { POST } = await import("../route");
      const response = await POST(
        new Request("http://localhost/api/catalog/deploy-drain?storefront=xa-b", {
          method: "POST",
          headers: { authorization: "Bearer drain-secret" },
        }),
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(
        expect.objectContaining({
          ok: true,
          storefront: "xa-b",
          status: "pending",
          deploy: expect.objectContaining({
            status: "skipped_cooldown",
            nextEligibleAt: cooldownUntil,
          }),
        }),
      );
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      nowSpy.mockRestore();
      fetchSpy.mockRestore();
    }
  });

  it("returns 503 when deploy hook is required but unconfigured", async () => {
    process.env.XA_B_DEPLOY_HOOK_REQUIRED = "1";

    const kvStore = new Map<string, string>();
    kvStore.set(
      "xa-deploy-pending:xa-b",
      JSON.stringify({
        pending: true,
        storefront: "xa-b",
        reasonCode: "unconfigured",
        firstDetectedAt: "2026-03-05T00:00:00.000Z",
        lastUpdatedAt: "2026-03-05T00:00:00.000Z",
        attempts: 0,
      }),
    );

    const kv = {
      get: jest.fn(async (key: string) => kvStore.get(key) ?? null),
      put: jest.fn(async () => undefined),
      delete: jest.fn(async () => undefined),
    };
    getUploaderKvMock.mockResolvedValue(kv as unknown as import("../../../../../lib/syncMutex").UploaderKvNamespace);

    const { POST } = await import("../route");
    const response = await POST(
      new Request("http://localhost/api/catalog/deploy-drain?storefront=xa-b", {
        method: "POST",
        headers: { authorization: "Bearer drain-secret" },
      }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: false,
        storefront: "xa-b",
        error: "deploy_hook_unconfigured",
        recovery: "configure_deploy_hook",
      }),
    );
  });
});
