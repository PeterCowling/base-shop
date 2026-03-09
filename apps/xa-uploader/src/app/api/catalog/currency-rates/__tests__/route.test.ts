import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

const readFileMock = jest.fn();
const writeFileMock = jest.fn();
const renameMock = jest.fn();
const mkdirMock = jest.fn();
const hasUploaderSessionMock = jest.fn();
const rateLimitMock = jest.fn();
const withRateHeadersMock = jest.fn();
const getRequestIpMock = jest.fn();
const resolveRepoRootMock = jest.fn();
const isLocalFsRuntimeEnabledMock = jest.fn();
const readCloudCurrencyRatesMock = jest.fn();
const writeCloudCurrencyRatesMock = jest.fn();

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
  withRateHeaders: (...args: unknown[]) => withRateHeadersMock(...args),
  getRequestIp: (...args: unknown[]) => getRequestIpMock(...args),
}));

jest.mock("../../../../../lib/repoRoot", () => ({
  resolveRepoRoot: () => resolveRepoRootMock(),
}));

jest.mock("../../../../../lib/localFsGuard", () => ({
  isLocalFsRuntimeEnabled: () => isLocalFsRuntimeEnabledMock(),
}));

jest.mock("../../../../../lib/catalogDraftContractClient", () => ({
  readCloudCurrencyRates: (...args: unknown[]) => readCloudCurrencyRatesMock(...args),
  writeCloudCurrencyRates: (...args: unknown[]) => writeCloudCurrencyRatesMock(...args),
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
    withRateHeadersMock.mockImplementation((response: Response) => response);
    getRequestIpMock.mockReturnValue("127.0.0.1");
    resolveRepoRootMock.mockReturnValue("/mock/root");
    isLocalFsRuntimeEnabledMock.mockReturnValue(true);
    mkdirMock.mockResolvedValue(undefined);
    writeFileMock.mockResolvedValue(undefined);
    renameMock.mockResolvedValue(undefined);
    readCloudCurrencyRatesMock.mockResolvedValue({ EUR: 0.93, GBP: 0.79, AUD: 1.55 });
    writeCloudCurrencyRatesMock.mockResolvedValue(undefined);
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

  it("GET returns invalid_rates when file contains invalid JSON", async () => {
    readFileMock.mockResolvedValueOnce("not-json");

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/currency-rates"));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      ok: false,
      error: "invalid_rates",
      reason: "currency_rates_invalid",
    });
  });

  it("GET returns invalid_rates when rates shape is invalid", async () => {
    readFileMock.mockResolvedValueOnce(JSON.stringify({ EUR: "0.93", GBP: 0.79, AUD: 1.55 }));

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/currency-rates"));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      ok: false,
      error: "invalid_rates",
      reason: "currency_rates_invalid",
    });
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

  it("GET reads cloud currency rates when local FS runtime is disabled", async () => {
    isLocalFsRuntimeEnabledMock.mockReturnValueOnce(false);

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/currency-rates"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      rates: { EUR: 0.93, GBP: 0.79, AUD: 1.55 },
    });
    expect(readFileMock).not.toHaveBeenCalled();
    expect(readCloudCurrencyRatesMock).toHaveBeenCalledWith("xa-b");
  });

  it("GET returns invalid_rates when hosted contract returns invalid stored rates", async () => {
    isLocalFsRuntimeEnabledMock.mockReturnValueOnce(false);
    readCloudCurrencyRatesMock.mockRejectedValueOnce(
      Object.assign(new Error("invalid"), { name: "CatalogDraftContractError", code: "invalid_response" }),
    );

    const { GET } = await import("../route");
    const response = await GET(new Request("http://localhost/api/catalog/currency-rates"));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      ok: false,
      error: "invalid_rates",
      reason: "currency_rates_invalid",
    });
    expect(readFileMock).not.toHaveBeenCalled();
  });

  it("PUT writes cloud currency rates when local FS runtime is disabled", async () => {
    isLocalFsRuntimeEnabledMock.mockReturnValueOnce(false);

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
    expect(writeFileMock).not.toHaveBeenCalled();
    expect(writeCloudCurrencyRatesMock).toHaveBeenCalledWith({
      storefront: "xa-b",
      rates: { EUR: 0.93, GBP: 0.79, AUD: 1.55 },
    });
  });
});
