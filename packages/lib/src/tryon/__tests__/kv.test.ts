import { kvGet, kvPut } from "../kv";

describe("kv helpers", () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, "TRYON_KV");
  const originalEnv = (globalThis as any).env;
  const originalEnvAlt = (globalThis as any).__env__;

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalDescriptor) {
      Object.defineProperty(globalThis, "TRYON_KV", originalDescriptor);
    } else {
      delete (globalThis as any).TRYON_KV;
    }
    if (originalEnv === undefined) {
      delete (globalThis as any).env;
    } else {
      (globalThis as any).env = originalEnv;
    }
    if (originalEnvAlt === undefined) {
      delete (globalThis as any).__env__;
    } else {
      (globalThis as any).__env__ = originalEnvAlt;
    }
  });

  it("returns null when no binding is available", async () => {
    delete (globalThis as any).TRYON_KV;
    delete (globalThis as any).env;
    delete (globalThis as any).__env__;

    await expect(kvGet("missing")).resolves.toBeNull();
    await expect(kvPut("key", "value")).resolves.toBeUndefined();
  });

  it("prefers the direct TRYON_KV binding", async () => {
    const get = jest.fn().mockResolvedValue("value");
    const put = jest.fn().mockResolvedValue(undefined);
    (globalThis as any).TRYON_KV = { get, put };

    await expect(kvGet("direct")).resolves.toBe("value");
    await kvPut("direct", "value", 30);
    expect(put).toHaveBeenCalledWith("direct", "value", { expirationTtl: 30 });
  });

  it("falls back to env bindings and swallows read/write errors", async () => {
    const get = jest.fn().mockRejectedValue(new Error("boom"));
    const put = jest.fn().mockRejectedValue(new Error("boom"));
    delete (globalThis as any).TRYON_KV;
    (globalThis as any).env = { TRYON_KV: { get, put } };

    await expect(kvGet("env")).resolves.toBeNull();
    await expect(kvPut("env", "value")).resolves.toBeUndefined();
    expect(get).toHaveBeenCalled();
    expect(put).toHaveBeenCalled();
  });

  it("supports __env__ bindings and optional TTL", async () => {
    const get = jest.fn().mockResolvedValue("shadow");
    const put = jest.fn().mockResolvedValue(undefined);
    delete (globalThis as any).TRYON_KV;
    delete (globalThis as any).env;
    (globalThis as any).__env__ = { TRYON_KV: { get, put } };

    await expect(kvGet("shadow")).resolves.toBe("shadow");
    await kvPut("shadow", "value");
    expect(put).toHaveBeenCalledWith("shadow", "value", undefined);
  });

  it("returns null when resolving the binding throws", async () => {
    Object.defineProperty(globalThis, "TRYON_KV", {
      configurable: true,
      get() {
        throw new Error("fail");
      },
    });

    await expect(kvGet("error")).resolves.toBeNull();
  });
});
