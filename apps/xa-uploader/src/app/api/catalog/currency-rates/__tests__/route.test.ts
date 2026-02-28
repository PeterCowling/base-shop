import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

const readFileMock = jest.fn();
const writeFileMock = jest.fn();
const renameMock = jest.fn();
const mkdirMock = jest.fn();
const hasUploaderSessionMock = jest.fn();
const rateLimitMock = jest.fn();
const applyRateLimitHeadersMock = jest.fn();
const getRequestIpMock = jest.fn();
const resolveRepoRootMock = jest.fn();

jest.mock("node:fs/promises", () => ({
  __esModule: true,
  default: {
    readFile: (...args: unknown[]) => readFileMock(...args),
    writeFile: (...args: unknown[]) => writeFileMock(...args),
    rename: (...args: unknown[]) => renameMock(...args),
    mkdir: (...args: unknown[]) => mkdirMock(...args),
  },
}));

jest.mock("../../../../../lib/uploaderAuth", () => ({
  hasUploaderSession: (...args: unknown[]) => hasUploaderSessionMock(...args),
}));

jest.mock("../../../../../lib/rateLimit", () => ({
  rateLimit: (...args: unknown[]) => rateLimitMock(...args),
  applyRateLimitHeaders: (...args: unknown[]) => applyRateLimitHeadersMock(...args),
  getRequestIp: (...args: unknown[]) => getRequestIpMock(...args),
}));

jest.mock("../../../../../lib/repoRoot", () => ({
  resolveRepoRoot: () => resolveRepoRootMock(),
}));

describe("currency rates route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "warn").mockImplementation(() => {});
    hasUploaderSessionMock.mockResolvedValue(true);
    rateLimitMock.mockReturnValue({
      allowed: true,
      remaining: 10,
      resetAt: Date.now() + 60_000,
    });
    applyRateLimitHeadersMock.mockImplementation(() => {});
    getRequestIpMock.mockReturnValue("127.0.0.1");
    resolveRepoRootMock.mockReturnValue("/mock/root");
    mkdirMock.mockResolvedValue(undefined);
    writeFileMock.mockResolvedValue(undefined);
    renameMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("GET returns { ok: true, rates: null } when file does not exist (ENOENT)", async () => {
    readFileMock.mockRejectedValueOnce(Object.assign(new Error("missing"), { code: "ENOENT" }));

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/currency-rates"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, rates: null });
  });

  it("GET returns { ok: true, rates: null } when file contains invalid JSON", async () => {
    readFileMock.mockResolvedValueOnce("not-json");

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/currency-rates"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, rates: null });
  });

  it("GET returns { ok: true, rates: null } when rates shape is invalid", async () => {
    readFileMock.mockResolvedValueOnce(JSON.stringify({ EUR: "0.93", GBP: 0.79, AUD: 1.55 }));

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/currency-rates"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, rates: null });
  });

  it("GET returns { ok: true, rates } when file contains valid rates", async () => {
    readFileMock.mockResolvedValueOnce(JSON.stringify({ EUR: 0.93, GBP: 0.79, AUD: 1.55 }));

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/currency-rates"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, rates: { EUR: 0.93, GBP: 0.79, AUD: 1.55 } });
  });

  it("PUT with valid rates returns { ok: true }", async () => {
    const { PUT } = await import("../route");
    const response = await PUT(
      new Request("http://localhost/api/catalog/currency-rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rates: { EUR: 0.93, GBP: 0.79, AUD: 1.55 } }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(mkdirMock).toHaveBeenCalledTimes(1);
    expect(writeFileMock).toHaveBeenCalledTimes(1);
    expect(renameMock).toHaveBeenCalledTimes(1);
  });

  it("PUT with zero EUR rate returns 400 with reason EUR_must_be_gt_zero", async () => {
    const { PUT } = await import("../route");
    const response = await PUT(
      new Request("http://localhost/api/catalog/currency-rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rates: { EUR: 0, GBP: 0.79, AUD: 1.55 } }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: "invalid_rates",
      reason: "EUR_must_be_gt_zero",
    });
  });

  it("PUT with missing rates field returns 400", async () => {
    const { PUT } = await import("../route");
    const response = await PUT(
      new Request("http://localhost/api/catalog/currency-rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: "invalid_rates",
      reason: "missing_rates_object",
    });
  });

  it("GET unauthenticated returns 404", async () => {
    hasUploaderSessionMock.mockResolvedValueOnce(false);

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/currency-rates"));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false });
    expect(readFileMock).not.toHaveBeenCalled();
  });
});
