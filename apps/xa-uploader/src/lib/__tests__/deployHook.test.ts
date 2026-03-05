import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

const getCloudflareContextMock = jest.fn();

jest.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: (...args: unknown[]) => getCloudflareContextMock(...args),
}));

const ORIGINAL_ENV = {
  XA_B_DEPLOY_HOOK_URL: process.env.XA_B_DEPLOY_HOOK_URL,
  XA_B_DEPLOY_HOOK_TOKEN: process.env.XA_B_DEPLOY_HOOK_TOKEN,
  XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS: process.env.XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS,
  XA_B_DEPLOY_HOOK_MAX_RETRIES: process.env.XA_B_DEPLOY_HOOK_MAX_RETRIES,
  XA_B_DEPLOY_HOOK_RETRY_BASE_DELAY_MS: process.env.XA_B_DEPLOY_HOOK_RETRY_BASE_DELAY_MS,
};

describe("deployHook", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    getCloudflareContextMock.mockRejectedValue(new Error("no_cloudflare_context"));
    process.env.XA_B_DEPLOY_HOOK_TOKEN = "deploy-token-1234567890";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (ORIGINAL_ENV.XA_B_DEPLOY_HOOK_URL === undefined) delete process.env.XA_B_DEPLOY_HOOK_URL;
    else process.env.XA_B_DEPLOY_HOOK_URL = ORIGINAL_ENV.XA_B_DEPLOY_HOOK_URL;
    if (ORIGINAL_ENV.XA_B_DEPLOY_HOOK_TOKEN === undefined) delete process.env.XA_B_DEPLOY_HOOK_TOKEN;
    else process.env.XA_B_DEPLOY_HOOK_TOKEN = ORIGINAL_ENV.XA_B_DEPLOY_HOOK_TOKEN;
    if (ORIGINAL_ENV.XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS === undefined) {
      delete process.env.XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS;
    } else {
      process.env.XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS = ORIGINAL_ENV.XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS;
    }
    if (ORIGINAL_ENV.XA_B_DEPLOY_HOOK_MAX_RETRIES === undefined) {
      delete process.env.XA_B_DEPLOY_HOOK_MAX_RETRIES;
    } else {
      process.env.XA_B_DEPLOY_HOOK_MAX_RETRIES = ORIGINAL_ENV.XA_B_DEPLOY_HOOK_MAX_RETRIES;
    }
    if (ORIGINAL_ENV.XA_B_DEPLOY_HOOK_RETRY_BASE_DELAY_MS === undefined) {
      delete process.env.XA_B_DEPLOY_HOOK_RETRY_BASE_DELAY_MS;
    } else {
      process.env.XA_B_DEPLOY_HOOK_RETRY_BASE_DELAY_MS = ORIGINAL_ENV.XA_B_DEPLOY_HOOK_RETRY_BASE_DELAY_MS;
    }
  });

  it("uses service binding for workers.dev deploy hook URLs", async () => {
    process.env.XA_B_DEPLOY_HOOK_URL =
      "https://xa-drop-worker-preview.example-account.workers.dev/deploy/xa-b";

    const bindingFetchMock = jest.fn(async () => new Response(null, { status: 202 }));
    getCloudflareContextMock.mockResolvedValueOnce({
      env: {
        XA_CATALOG_CONTRACT_SERVICE: {
          fetch: bindingFetchMock,
        },
      },
    });
    global.fetch = jest.fn(async () => new Response(null, { status: 500 })) as unknown as typeof fetch;

    const { maybeTriggerXaBDeploy } = await import("../deployHook");
    const result = await maybeTriggerXaBDeploy({ storefrontId: "xa-b", kv: null });

    expect(result.status).toBe("triggered");
    expect(bindingFetchMock).toHaveBeenCalledWith(
      "https://catalog-contract.internal/deploy/xa-b",
      expect.objectContaining({ method: "POST" }),
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("uses direct fetch for non-workers deploy hook URLs", async () => {
    process.env.XA_B_DEPLOY_HOOK_URL =
      "https://api.cloudflare.com/client/v4/pages/webhooks/deploy-hook-token";

    getCloudflareContextMock.mockResolvedValueOnce({
      env: {
        XA_CATALOG_CONTRACT_SERVICE: {
          fetch: jest.fn(async () => new Response(null, { status: 500 })),
        },
      },
    });
    global.fetch = jest.fn(async () => new Response(null, { status: 202 })) as unknown as typeof fetch;

    const { maybeTriggerXaBDeploy } = await import("../deployHook");
    const result = await maybeTriggerXaBDeploy({ storefrontId: "xa-b", kv: null });

    expect(result.status).toBe("triggered");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.cloudflare.com/client/v4/pages/webhooks/deploy-hook-token",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("applies cooldown across rapid publishes and re-triggers after cooldown expires", async () => {
    process.env.XA_B_DEPLOY_HOOK_URL =
      "https://xa-drop-worker-preview.example-account.workers.dev/deploy/xa-b";
    process.env.XA_B_DEPLOY_HOOK_COOLDOWN_SECONDS = "900";

    const kvStore = new Map<string, string>();
    const kv = {
      get: jest.fn(async (key: string) => kvStore.get(key) ?? null),
      put: jest.fn(async (key: string, value: string) => {
        kvStore.set(key, value);
      }),
      delete: jest.fn(async (key: string) => {
        kvStore.delete(key);
      }),
    };

    const bindingFetchMock = jest.fn(async () => new Response(null, { status: 202 }));
    getCloudflareContextMock.mockResolvedValue({
      env: {
        XA_CATALOG_CONTRACT_SERVICE: {
          fetch: bindingFetchMock,
        },
      },
    });

    const nowSpy = jest.spyOn(Date, "now");
    let nowMs = Date.parse("2026-03-05T10:00:00.000Z");
    nowSpy.mockImplementation(() => nowMs);

    try {
      const { maybeTriggerXaBDeploy } = await import("../deployHook");

      const first = await maybeTriggerXaBDeploy({
        storefrontId: "xa-b",
        kv: kv as unknown as import("../syncMutex").UploaderKvNamespace,
      });
      expect(first.status).toBe("triggered");
      expect(first.nextEligibleAt).toBeDefined();
      expect(bindingFetchMock).toHaveBeenCalledTimes(1);

      const second = await maybeTriggerXaBDeploy({
        storefrontId: "xa-b",
        kv: kv as unknown as import("../syncMutex").UploaderKvNamespace,
      });
      expect(second.status).toBe("skipped_cooldown");
      expect(bindingFetchMock).toHaveBeenCalledTimes(1);

      nowMs = Date.parse(first.nextEligibleAt ?? "2026-03-05T10:15:01.000Z") + 1_000;

      const third = await maybeTriggerXaBDeploy({
        storefrontId: "xa-b",
        kv: kv as unknown as import("../syncMutex").UploaderKvNamespace,
      });
      expect(third.status).toBe("triggered");
      expect(bindingFetchMock).toHaveBeenCalledTimes(2);
    } finally {
      nowSpy.mockRestore();
    }
  });

  it("retries transient deploy hook failures and succeeds on a later attempt", async () => {
    process.env.XA_B_DEPLOY_HOOK_URL = "https://deploy.example/hook";
    process.env.XA_B_DEPLOY_HOOK_MAX_RETRIES = "2";
    process.env.XA_B_DEPLOY_HOOK_RETRY_BASE_DELAY_MS = "1";

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(new Response("try again", { status: 503 }))
      .mockResolvedValueOnce(new Response("", { status: 202 })) as unknown as typeof fetch;

    const { maybeTriggerXaBDeploy } = await import("../deployHook");
    const result = await maybeTriggerXaBDeploy({ storefrontId: "xa-b", kv: null });

    expect(result.status).toBe("triggered");
    expect(result.attempts).toBe(2);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("fails after retry exhaustion on repeated transient errors", async () => {
    process.env.XA_B_DEPLOY_HOOK_URL = "https://deploy.example/hook";
    process.env.XA_B_DEPLOY_HOOK_MAX_RETRIES = "2";
    process.env.XA_B_DEPLOY_HOOK_RETRY_BASE_DELAY_MS = "1";

    global.fetch = jest
      .fn()
      .mockResolvedValue(new Response("temporarily unavailable", { status: 503 })) as unknown as typeof fetch;

    const { maybeTriggerXaBDeploy } = await import("../deployHook");
    const result = await maybeTriggerXaBDeploy({ storefrontId: "xa-b", kv: null });

    expect(result).toEqual(
      expect.objectContaining({
        status: "failed",
        attempts: 3,
        httpStatus: 503,
      }),
    );
    expect(result.reason).toContain("after 3 attempts");
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
});
